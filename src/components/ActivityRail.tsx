import { useState } from "react";
import { useLocal } from "../hooks/useLocal";
import { localDate, shiftDate, noteError } from "../services/exceptions";
import {
  eventKey,
  observationError,
  type Activity,
  type Observation,
  type Selection,
} from "../services/desk";
export function ActivityRail({
  selection,
  observations,
  saveObservations,
  now,
}: {
  selection: Selection;
  observations: Observation[];
  saveObservations: (v: Observation[]) => boolean;
  now: Date;
}) {
  const [events, saveEvents, eventError] = useLocal<Activity[]>(
    "exceptions",
    [],
  );
  const [draft, setDraft] = useState<Activity | null>(null);
  const [selected, setSelected] = useState<Activity | null>(null);
  const [observedDate, setObservedDate] = useState("");
  const [direction, setDirection] = useState<Observation["direction"]>("下降");
  const [percent, setPercent] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const today = localDate(now);
  const dates = [
    ["今天", today],
    ["昨天", shiftDate(today, -1)],
    ["七天前", shiftDate(today, -7)],
  ];
  const applicable = events.filter(
    (e) => !e.region || !selection.region || e.region === selection.region,
  );
  function add() {
    setDraft({
      id: crypto.randomUUID(),
      title: "",
      category: "節假日",
      region: selection.region,
      startDate: today,
      endDate: today,
      note: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setError("");
    setSelected(null);
  }
  return (
    <section className="desk-block activity-rail">
      <div className="desk-row">
        <h2>活動／節假日背景</h2>
        <button onClick={add}>＋新增</button>
      </div>
      <p className="desk-muted">
        依裝置日期；人工維護，未串接節假日或賽程資料。空白不代表當天沒有活動。
      </p>
      {draft && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const err = noteError(draft);
            if (err) {
              setError(err);
              return;
            }
            if (
              saveEvents([
                {
                  ...draft,
                  title: draft.title.trim(),
                  updatedAt: new Date().toISOString(),
                },
                ...events.filter((x) => x.id !== draft.id),
              ])
            )
              setDraft(null);
          }}
        >
          <label>
            活動名稱
            <input
              required
              maxLength={100}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </label>
          <label>
            分類
            <select
              aria-label="活動分類"
              value={draft.category}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  category: e.target.value as Activity["category"],
                })
              }
            >
              <option>節假日</option>
              <option>球賽／活動</option>
              <option>其他</option>
              <option>CCU 觀察</option>
            </select>
          </label>
          <label>
            地區（留空為全部）
            <input
              value={draft.region ?? ""}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  region: e.target.value.trim().toUpperCase(),
                })
              }
            />
          </label>
          <label>
            開始日期
            <input
              type="date"
              required
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
              value={draft.endDate}
              onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
            />
          </label>
          <div className="desk-row">
            <button type="submit">儲存活動</button>
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
      )}
      {dates.map(([label, date]) => (
        <div className="activity-day" key={date}>
          <h3>
            {label} <small>{date}</small>
          </h3>
          {applicable
            .filter((e) => e.startDate <= date && e.endDate >= date)
            .map((e) => (
              <div className="activity-item" key={e.id}>
                <button
                  className="activity-name"
                  onClick={() => {
                    setSelected(e);
                    setObservedDate(date);
                    setPercent("");
                    setNote("");
                    setError("");
                    setDraft(null);
                  }}
                >
                  {e.title}
                  <small>
                    {e.region || "全部地區"} · {e.category} · 點擊備註
                  </small>
                </button>
                <div className="desk-row">
                  <button
                    onClick={() => {
                      setDraft({ ...e });
                      setSelected(null);
                    }}
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("刪除活動？已儲存的觀察仍保留。"))
                        saveEvents(events.filter((x) => x.id !== e.id));
                    }}
                  >
                    刪除
                  </button>
                </div>
                {observations
                  .filter(
                    (o) =>
                      o.eventKey === eventKey(e.title, e.region ?? "") &&
                      (!selection.region || o.region === selection.region) &&
                      (!selection.productId ||
                        o.productId === selection.productId),
                  )
                  .slice(0, 3)
                  .map((o) => (
                    <p className="history-hint" key={o.id}>
                      {o.eventDate} · {o.region || "地區未記錄"} · {o.direction}
                      {o.percent === null ? "" : ` ${o.percent}%`}
                      <br />
                      {o.note}
                    </p>
                  ))}
              </div>
            ))}
          {!applicable.some(
            (e) => e.startDate <= date && e.endDate >= date,
          ) && <p className="desk-muted">尚未記錄活動</p>}
        </div>
      ))}
      {selected && (
        <form
          className="observation-form"
          onSubmit={(e) => {
            e.preventDefault();
            const err = observationError(direction, percent);
            if (err) {
              setError(err);
              return;
            }
            const o: Observation = {
              id: crypto.randomUUID(),
              eventKey: eventKey(selected.title, selected.region ?? ""),
              eventTitle: selected.title,
              eventDate: observedDate,
              region: selection.region || selected.region || "",
              productId: selection.productId,
              direction,
              percent: percent.trim() ? Number(percent) : null,
              note: note.trim(),
              createdAt: new Date().toISOString(),
            };
            if (saveObservations([o, ...observations])) {
              setSelected(null);
              setError("");
            }
          }}
        >
          <h3>記錄觀察：{selected.title}</h3>
          <p>
            {observedDate} · {selection.region || selected.region || "地區未選"}{" "}
            · {selection.productId || "產品未選"}
          </p>
          <label>
            CCU 變化
            <select
              aria-label="CCU 變化"
              value={direction}
              onChange={(e) =>
                setDirection(e.target.value as Observation["direction"])
              }
            >
              <option>下降</option>
              <option>上升</option>
              <option>無明顯變化</option>
            </select>
          </label>
          <label>
            幅度 %（選填）
            <input
              type="number"
              min="0"
              max={direction === "下降" ? 100 : undefined}
              step="any"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
            />
          </label>
          <label>
            觀察備註
            <textarea
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <p className="desk-muted">
            僅存本機知識紀錄，不代表因果關係；請遵守公司本機儲存政策。
          </p>
          <button>存進本機知識庫</button>
          <button
            type="button"
            onClick={() => {
              setSelected(null);
              setError("");
            }}
          >
            取消
          </button>
        </form>
      )}
      {(error || eventError) && <p role="alert">{error || eventError}</p>}
      <p className="desk-muted">
        活動名稱＋地區相同時會提示歷次觀察；不會把今年活動自動推定到明年。
      </p>
      <details>
        <summary>全部活動（{events.length}）</summary>
        {events.map((e) => (
          <button
            key={e.id}
            onClick={() => {
              setDraft({ ...e });
              setSelected(null);
            }}
          >
            {e.title} · {e.startDate}
          </button>
        ))}
      </details>
    </section>
  );
}
