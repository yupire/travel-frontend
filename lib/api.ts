import type { City, TripRequest, TripResponse } from "@/types/trip";

// 浏览器侧统一走同源的 /api 前缀，由 Next.js 的 rewrites 代理到 Python 后端，
// 避免直接请求后端端口导致的跨域；服务端渲染时仍可用 PYTHON_SERVICE_URL 直连。
const BASE_URL =
  typeof window === "undefined"
    ? `${process.env.PYTHON_SERVICE_URL ?? "http://localhost:8000"}`
    : "/api";

// 按名称查询单个城市 —— 输入值填充到 /cities/{location} 进行实时查询。
export async function lookupCity(location: string): Promise<City> {
  const res = await fetch(
    `${BASE_URL}/cities/${encodeURIComponent(location)}`,
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "城市查询失败" }));
    throw new Error(err.detail ?? "未找到该城市");
  }
  const data = await res.json();
  return data.cities as City;
}

export async function planTrip(req: TripRequest): Promise<TripResponse> {
  const res = await fetch(`${BASE_URL}/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(err.detail ?? "规划失败，请稍后再试");
  }
  return res.json() as Promise<TripResponse>;
}

// 流式进度事件：Agent 每调用一个工具、以及进入结构化整理阶段时由后端推送。
// stage：start（开始分析）/ tool（正在调用某工具）/ formatting（整理行程）。
// step：后端 Graph 的步骤计数，仅用于展示「走到第几步」。
export interface PlanProgress {
  type: "progress";
  stage: string;
  step?: number;
  message: string;
}

// 流式规划：消费后端 /plan/stream 的 NDJSON 流。
// 每行一个 JSON 事件：progress（进度提示）/ result（最终行程）/ error。
// onProgress 在收到 progress 事件时回调，便于前端先展示「正在整理」等过渡态。
export async function planTripStream(
  req: TripRequest,
  onProgress?: (p: PlanProgress) => void,
): Promise<TripResponse> {
  const res = await fetch(`${BASE_URL}/plan/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: "请求失败" }));
    throw new Error(err.detail ?? "规划失败，请稍后再试");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: TripResponse | null = null;

  // 处理一行 JSON 事件：分发到进度 / 结果 / 错误。
  // JSON.parse 用 try/catch 包住：心跳/半行/脏数据解析失败时跳过该行，绝不让一行坏数据
  // 抛出未捕获异常、中断整条流。业务 error 事件仍会主动 throw，交由调用方展示。
  const handleLine = (line: string) => {
    const text = line.trim();
    if (!text) return;
    let evt: { type?: string; data?: unknown; detail?: string };
    try {
      evt = JSON.parse(text);
    } catch {
      return;
    }
    switch (evt.type) {
      case "progress":
        onProgress?.(evt as unknown as PlanProgress);
        break;
      case "result":
        result = evt.data as TripResponse;
        break;
      case "error":
        throw new Error(evt.detail ?? "规划失败，请稍后再试");
      // heartbeat / 未知 type：仅用于保活，忽略即可
      default:
        break;
    }
  };

  for (; ;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch {
      // 底层连接中断 / 读取失败：转成友好错误交给调用方，避免未捕获的网络异常
      throw new Error("连接中断，请稍后重试");
    }
    const { done, value } = chunk;
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      handleLine(line);
    }
  }
  // 冲洗末尾可能残留的最后一行（无结尾换行时）
  handleLine(buffer);

  if (!result) throw new Error("未收到规划结果，请稍后再试");
  return result;
}
