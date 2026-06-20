"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import dayjs, { type Dayjs } from "dayjs";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickerDay, type PickerDayProps } from "@mui/x-date-pickers/PickerDay";
import { lookupCity, planTripStream, type PlanProgress } from "@/lib/api";
import type { City, TripResponse } from "@/types/trip";
import ItineraryView from "./ItineraryView";

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
            bgcolor: "rgba(76, 175, 80, 0.12) !important",
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

export default function TripForm() {
  // 目的地：用户输入的关键词 + 通过 /cities/{location} 实时解析的城市
  const [query, setQuery] = useState("");
  const [resolved, setResolved] = useState<City | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState<string | null>(null);

  const [range, setRange] = useState<RangeDraft>({
    start: dayjs(),
    end: dayjs().add(2, "day"),
  });
  const [loading, setLoading] = useState(false);
  // 流式进度列表：每收到一条后端 progress 事件就追加一项，按步骤展示「当前在做什么」。
  // 最终行程（result）返回后清空，页面只展示行程内容。
  const [steps, setSteps] = useState<PlanProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TripResponse | null>(null);

  // Dialog + draft range
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<RangeDraft>(range);

  // 输入目的地后防抖查询 /cities/{location}
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResolved(null);
      setCityError(null);
      setCityLoading(false);
      return;
    }
    setCityLoading(true);
    setCityError(null);
    const handle = setTimeout(async () => {
      try {
        const city = await lookupCity(q);
        setResolved(city);
        setCityError(null);
      } catch (err: unknown) {
        setResolved(null);
        setCityError(err instanceof Error ? err.message : "未找到该城市");
      } finally {
        setCityLoading(false);
      }
    }, 450);
    return () => clearTimeout(handle);
  }, [query]);

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

  const days = useMemo(() => dayCount(range.start, range.end), [range]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { start, end } = range;
    if (!resolved || !start || !end) return;
    setLoading(true);
    setSteps([]);
    setError(null);
    setResult(null);
    try {
      const data = await planTripStream(
        {
          city: resolved.name,
          start_date: start.format("YYYY-MM-DD"),
          end_date: end.format("YYYY-MM-DD"),
        },
        // 每收到一条进度事件就追加到步骤列表，实时展示「走到第几步、做什么」
        (p) => setSteps((prev) => [...prev, p]),
      );
      // 收到最终行程：清空进度，只展示行程内容
      setSteps([]);
      setResult(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "规划失败，请检查后端服务是否启动",
      );
    } finally {
      setLoading(false);
      setSteps([]);
    }
  }

  const calendarValue = draft.start ?? dayjs();

  // Stable callback for RangeDay so React doesn't recreate component every render
  const renderDay = useCallback(
    (dayProps: PickerDayProps) => (
      <RangeDay {...dayProps} rangeStart={draft.start} rangeEnd={draft.end} />
    ),
    [draft.start, draft.end],
  );

  return (
    <div className="space-y-4">
      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4"
      >
        {/* Destination — free text, resolved via /cities/{location} */}
        <TextField
          fullWidth
          label="目的地"
          size="medium"
          placeholder="输入城市名，如 北京"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          error={Boolean(cityError)}
          helperText={
            cityLoading
              ? "查询中…"
              : cityError
                ? cityError
                : resolved
                  ? `已找到：${resolved.name} · ${resolved.country}`
                  : "输入目的地后自动查询"
          }
          slotProps={{
            input: {
              sx: { padding: "10px" },
              endAdornment: (
                <span className="text-gray-400 text-lg pl-2 select-none">
                  {cityLoading ? "⏳" : "📍"}
                </span>
              ),
            },
          }}
        />

        {/* Date range — single field, click to open dialog */}
        <TextField
          fullWidth
          label="出行日期"
          size="medium"
          value={formatRange(range.start, range.end)}
          onClick={openPicker}
          slotProps={{
            input: {
              sx: { padding: "10px" },
              readOnly: true,
              endAdornment: (
                <span className="text-gray-400 text-lg pl-2 select-none">
                  📅
                </span>
              ),
            },
          }}
          helperText={days > 0 ? `共 ${days} 天` : "点击选择出发与返回日期"}
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !resolved}
          className="w-full bg-brand-800 text-white font-semibold rounded-xl py-3.5 text-base active:scale-[0.98] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "AI规划中…" : "开始规划"}
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.25 }}
          >
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

      {/* Loading —— 展示流式进度列表：已完成的步骤打勾，最新一步转圈进行中 */}
      {loading && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-brand-700 rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">
              AI正在规划您的专属行程…
            </p>
          </div>

          {steps.length === 0 ? (
            <p className="text-xs text-gray-400">
              查询天气 · 匹配路线 · 推荐美食
            </p>
          ) : (
            <ul className="space-y-2">
              {steps.map((s, i) => {
                const isLast = i === steps.length - 1;
                return (
                  <li
                    key={`${s.step ?? i}-${i}`}
                    className="flex items-start gap-2 text-sm"
                  >
                    <span className="mt-0.5 shrink-0">
                      {isLast ? (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-gray-200 border-t-brand-700 rounded-full animate-spin" />
                      ) : (
                        <span className="text-brand-700">✓</span>
                      )}
                    </span>
                    <span
                      className={
                        isLast ? "text-gray-800" : "text-gray-400 line-through"
                      }
                    >
                      {s.message}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
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
