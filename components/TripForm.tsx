"use client";

import { useState, useMemo, useCallback } from "react";
import dayjs, { type Dayjs } from "dayjs";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickerDay, type PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import { planTrip } from "@/lib/api";
import type { City, TripResponse } from "@/types/trip";
import ItineraryView from "./ItineraryView";

interface Props {
  cities: City[];
}

type RangeDraft = { start: Dayjs | null; end: Dayjs | null };

function formatRange(start: Dayjs | null, end: Dayjs | null) {
  if (!start) return "";
  if (!end || end.isSame(start, "day")) return start.format("YYYY-MM-DD");
  return `${start.format("MM/DD")} → ${end.format("MM/DD")}`;
}

function dayCount(start: Dayjs | null, end: Dayjs | null) {
  if (!start || !end) return 0;
  return Math.max(1, end.diff(start, "day") + 1);
}

/* ── Range-aware day cell ──────────────────────────────────── */

function RangeDay({
  day,
  outsideCurrentMonth,
  rangeStart,
  rangeEnd,
  ...other
}: PickerDayProps & { rangeStart: Dayjs | null; rangeEnd: Dayjs | null }) {
  const d = dayjs(day as Parameters<typeof dayjs>[0]);
  const isStart = rangeStart ? d.isSame(rangeStart, "day") : false;
  const isEnd = rangeEnd ? d.isSame(rangeEnd, "day") : false;
  const inRange =
    rangeStart && rangeEnd && !outsideCurrentMonth
      ? (d.isAfter(rangeStart, "day") || isStart) &&
        (d.isBefore(rangeEnd, "day") || isEnd)
      : false;

  return (
    <PickerDay
      day={day}
      outsideCurrentMonth={outsideCurrentMonth}
      {...other}
      sx={{
        // Range strip background
        ...(inRange &&
          !isStart &&
          !isEnd && {
            bgcolor: "rgba(22, 101, 52, 0.12) !important",
            color: "primary.main",
            borderRadius: 0,
          }),
        // Start pill
        ...(isStart && {
          bgcolor: "primary.main !important",
          color: "common.white !important",
          borderTopLeftRadius: "50%",
          borderBottomLeftRadius: "50%",
          borderTopRightRadius: isEnd ? "50%" : 0,
          borderBottomRightRadius: isEnd ? "50%" : 0,
        }),
        // End pill
        ...(isEnd &&
          !isStart && {
            bgcolor: "primary.main !important",
            color: "common.white !important",
            borderTopRightRadius: "50%",
            borderBottomRightRadius: "50%",
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }),
      }}
    />
  );
}

/* ── Main form ─────────────────────────────────────────────── */

export default function TripForm({ cities }: Props) {
  const [city, setCity] = useState(cities[0]?.id ?? "");
  const [range, setRange] = useState<RangeDraft>({
    start: dayjs(),
    end: dayjs().add(2, "day"),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TripResponse | null>(null);

  // Dialog + draft range
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RangeDraft>(range);

  function openPicker() {
    setDraft(range);
    setOpen(true);
  }
  function closePicker() {
    setOpen(false);
  }
  function commit() {
    if (draft.start && draft.end) {
      setRange({ start: draft.start, end: draft.end });
    }
    closePicker();
  }
  function clear() {
    setDraft({ start: null, end: null });
  }

  const cityLabel = cities.find((c) => c.id === city);
  const days = useMemo(() => dayCount(range.start, range.end), [range]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { start, end } = range;
    if (!city || !start || !end) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await planTrip({
        city,
        start_date: start.format("YYYY-MM-DD"),
        end_date: end.format("YYYY-MM-DD"),
      });
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "规划失败，请检查后端服务是否启动");
    } finally {
      setLoading(false);
    }
  }

  if (cities.length === 0) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        无法连接后端服务，请先启动 FastAPI（<code>uvicorn main:app --reload</code>）
      </div>
    );
  }

  const calendarValue = draft.start ?? dayjs();

  // Stable callback for RangeDay so React doesn't recreate component every render
  const renderDay = useCallback(
    (dayProps: PickerDayProps) => (
      <RangeDay
        {...dayProps}
        rangeStart={draft.start}
        rangeEnd={draft.end}
      />
    ),
    [draft.start, draft.end],
  );

  return (
    <div className="space-y-4">
      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
        {/* City select */}
        <TextField
          select
          fullWidth
          label="目的地"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          size="medium"
          slotProps={{
            select: {
              MenuProps: {
                sx: { "& .MuiPaper-root": { borderRadius: 3, maxHeight: 360 } },
              },
            },
          }}
        >
          {cities.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name} · {c.country}
            </MenuItem>
          ))}
        </TextField>

        {/* Date range — single field, click to open dialog */}
        <TextField
          fullWidth
          label="出行日期"
          size="medium"
          value={formatRange(range.start, range.end)}
          onClick={openPicker}
          slotProps={{
            input: {
              readOnly: true,
              endAdornment: (
                <span className="text-gray-400 text-lg pl-2 select-none">📅</span>
              ),
            },
          }}
          helperText={
            days > 0
              ? `共 ${days} 天`
              : "点击选择出发与返回日期"
          }
          sx={{ cursor: "pointer", "& .MuiOutlinedInput-root": { cursor: "pointer" } }}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-800 text-white font-semibold rounded-xl py-3.5 text-base active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "AI规划中…" : `规划${cityLabel ? cityLabel.name : ""}行程`}
        </button>
      </form>

      {/* Date Range Dialog — renders in portal, immune to overflow clipping */}
      <Dialog
        open={open}
        onClose={closePicker}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 4, m: 2, overflow: "visible" } },
        }}
      >
        <DialogTitle sx={{ pb: 0.5, fontSize: "1rem" }}>
          选择出行日期
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
            {draft.start && draft.end
              ? `已选 ${draft.start.format("MM-DD")} 至 ${draft.end.format("MM-DD")}（${dayCount(draft.start, draft.end)}天）`
              : draft.start
                ? "请选择返回日期"
                : "请选择出发日期"}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 1, "&.MuiDialogContent-root": { pt: 1 } }}>
          <DateCalendar
            value={calendarValue}
            minDate={dayjs()}
            disablePast
            onChange={(d) => {
              if (!d) return;
              if (!draft.start || (draft.start && draft.end)) {
                // Fresh selection or re-selection after both picked
                setDraft({ start: d, end: null });
              } else if (d.isBefore(draft.start, "day")) {
                setDraft({ start: d, end: draft.start });
              } else if (d.isSame(draft.start, "day")) {
                setDraft({ start: d, end: d });
              } else {
                setDraft({ start: draft.start, end: d });
              }
            }}
            slots={{ day: renderDay }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button size="small" onClick={clear} color="inherit">
            清空
          </Button>
          <Button size="small" onClick={closePicker} color="inherit">
            取消
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={commit}
            disabled={!draft.start || !draft.end}
          >
            确定
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-10 text-gray-500">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-brand-700 rounded-full animate-spin" />
          <p className="text-sm">AI正在规划您的专属行程…</p>
          <p className="text-xs text-gray-400">查询天气 · 匹配路线 · 推荐美食</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && <ItineraryView data={result} />}
    </div>
  );
}
