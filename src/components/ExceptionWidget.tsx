import { useEffect, useRef, useState } from "react";
import {
  BellRing,
  CalendarDays,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { ExceptionNote } from "../types";
import { useLocal } from "../hooks/useLocal";
import {
  exceptionCategories,
  exceptionStatus,
  isExceptionNote,
  localDate,
  noteError,
  recentExceptions,
  thisWeek,
} from "../services/exceptions";

export function ExceptionWidget() {
  const [stored, save, storageError] = useLocal<ExceptionNote[]>(
    "exceptions",
    [],
  );
  const [open, setOpen] = useLocal("exceptions-open", false);
  const [now, setNow] = useState(() => new Date());
  const [all, setAll] = useState(false);
  const [draft, setDraft] = useState<ExceptionNote | null>(null);
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  useEffect(() => {
    if (draft) titleInput.current?.focus();
  }, [draft?.id]);
  const notes = Array.isArray(stored) ? stored.filter(isExceptionNote) : [];
  const today = localDate(now);
  const current = notes.filter(
    (n) => exceptionStatus(n, today) === "有效中",
  ).length;
  const visible = recentExceptions(notes, today, all);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  function add() {
    setError("");
    setDraft({
      id: crypto.randomUUID(),
      title: "",
      category: "其他",
      ...thisWeek(now),
      note: "",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }
  return (
    <div className="exception-widget">
      {open && (
        <section
          id="exception-window"
          className="exception-window"
          aria-labelledby="exception-heading"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
        >
          <div className="exception-header">
            <span className="exception-icon">
              <CalendarDays size={19} />
            </span>
            <div>
              <h2 id="exception-heading">近期特例</h2>
              <small>觀察背景 · 僅存本機</small>
            </div>
            <button
              className="icon-btn"
              aria-label="收合近期特例"
              onClick={close}
            >
              <X size={18} />
            </button>
          </div>
          <div className="exception-scroll">
            <p className="exception-hint">
              記下節假日、球賽或趨勢提醒，排查時多一份背景。提醒不代表已確認原因。
            </p>
            {draft ? (
              <form
                className="exception-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const message = noteError(draft);
                  if (message) {
                    setError(message);
                    return;
                  }
                  if (
                    save([
                      {
                        ...draft,
                        title: draft.title.trim(),
                        note: draft.note.trim(),
                        updatedAt: new Date().toISOString(),
                      },
                      ...notes.filter((n) => n.id !== draft.id),
                    ])
                  ) {
                    setDraft(null);
                    setError("");
                  }
                }}
              >
                <h3>
                  {notes.some((n) => n.id === draft.id)
                    ? "編輯特例"
                    : "新增特例"}
                </h3>
                <label>
                  提醒標題
                  <input
                    ref={titleInput}
                    required
                    maxLength={100}
                    placeholder="例如：本週有大型活動，留意趨勢"
                    value={draft.title}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                  />
                </label>
                <label>
                  特例分類
                  <select
                    aria-label="特例分類"
                    value={draft.category}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        category: e.target.value as ExceptionNote["category"],
                      })
                    }
                  >
                    {exceptionCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <div className="exception-dates">
                  <label>
                    開始日期
                    <input
                      type="date"
                      required
                      min="1900-01-01"
                      max="9999-12-31"
                      value={draft.startDate}
                      onChange={(e) =>
                        setDraft({ ...draft, startDate: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    結束日期
                    <input
                      type="date"
                      required
                      min="1900-01-01"
                      max="9999-12-31"
                      value={draft.endDate}
                      onChange={(e) =>
                        setDraft({ ...draft, endDate: e.target.value })
                      }
                    />
                  </label>
                </div>
                <div className="exception-presets">
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, startDate: today, endDate: today })
                    }
                  >
                    今天
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, ...thisWeek(now) })}
                  >
                    本週（一～日）
                  </button>
                </div>
                <label>
                  補充說明（選填）
                  <textarea
                    maxLength={500}
                    rows={3}
                    value={draft.note}
                    placeholder="只寫非機敏的背景提醒，不填實際 CCU 人數、內部網址或帳密。"
                    onChange={(e) =>
                      setDraft({ ...draft, note: e.target.value })
                    }
                  />
                </label>
                {error && (
                  <p className="exception-error" role="alert">
                    {error}
                  </p>
                )}
                <div className="actions">
                  <button className="primary" type="submit">
                    儲存特例
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(null);
                      setError("");
                    }}
                  >
                    取消
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="exception-toolbar">
                  <div className="exception-tabs" aria-label="特例篩選">
                    <button aria-pressed={!all} onClick={() => setAll(false)}>
                      近期
                    </button>
                    <button aria-pressed={all} onClick={() => setAll(true)}>
                      全部 {notes.length}
                    </button>
                  </div>
                  <button className="exception-add" onClick={add}>
                    <Plus size={14} />
                    新增特例
                  </button>
                </div>
                <p className="exception-range">
                  {all
                    ? "所有日期的本機提醒"
                    : "今天前後 7 天，含仍在有效期間的提醒"}{" "}
                  · 依此裝置日期
                </p>
                <div className="exception-list">
                  {visible.map((n) => (
                    <article className="exception-card" key={n.id}>
                      <div className="exception-meta">
                        <span>{n.category}</span>
                        <span
                          className={
                            "exception-status " +
                            (exceptionStatus(n, today) === "有效中"
                              ? "active"
                              : "")
                          }
                        >
                          {exceptionStatus(n, today)}
                        </span>
                      </div>
                      <h3>{n.title}</h3>
                      <p className="exception-period">
                        <CalendarDays size={12} />
                        {n.startDate} — {n.endDate}
                      </p>
                      {n.note && <p className="exception-note">{n.note}</p>}
                      <div className="exception-card-actions">
                        <button
                          aria-label={"編輯特例 " + n.title}
                          onClick={() => {
                            setDraft({ ...n });
                            setError("");
                          }}
                        >
                          <Pencil size={12} />
                          編輯
                        </button>
                        <button
                          aria-label={"刪除特例 " + n.title}
                          onClick={() => {
                            if (confirm("刪除此本機特例提醒？"))
                              save(notes.filter((x) => x.id !== n.id));
                          }}
                        >
                          <Trash2 size={12} />
                          刪除
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                {!visible.length && (
                  <div className="exception-empty">
                    <CalendarDays size={26} />
                    <strong>
                      {notes.length ? "近期沒有特例" : "還沒有特例提醒"}
                    </strong>
                    <p>
                      {notes.length
                        ? "切換「全部」查看其他日期，或新增一則提醒。"
                        : "把近期活動或觀察記下來，讓下一次排查更有脈絡。"}
                    </p>
                    <button onClick={add}>
                      <Plus size={14} />
                      新增提醒
                    </button>
                  </div>
                )}
              </>
            )}
            {storageError && (
              <p className="exception-error" role="alert">
                {storageError}
              </p>
            )}
            <p className="exception-privacy">
              不自動同步或上傳。請勿保存機敏資訊；可在設定清除本機資料。
            </p>
          </div>
        </section>
      )}
      <button
        ref={trigger}
        className="exception-trigger"
        aria-expanded={open}
        aria-controls={open ? "exception-window" : undefined}
        onClick={() => setOpen(!open)}
      >
        <BellRing size={17} />
        <span>近期特例</span>
        <span
          className="exception-count"
          title="目前有效提醒數"
          aria-label={`${current} 則有效提醒`}
        >
          {current}
        </span>
        {open && <ChevronDown size={15} />}
      </button>
    </div>
  );
}
