import type { Metadata, Viewport } from "next";
import "./globals.css";
import MuiProvider from "@/components/MuiProvider";

export const metadata: Metadata = {
  title: "AI旅行规划助手",
  description: "智能生成个性化行程，天气自适应安排，美食精准推荐",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <MuiProvider>
          <div className="min-h-screen flex flex-col items-center bg-[#f5f5f0]">
            <div className="w-full max-w-[430px] min-h-screen flex flex-col bg-white shadow-sm">
              {children}
            </div>
          </div>
        </MuiProvider>
      </body>
    </html>
  );
}
