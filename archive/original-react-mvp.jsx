import { useEffect, useMemo, useRef, useState } from "react";

const ORACLE_SYSTEMS = [
  {
    id: "guanyin",
    name: "觀音百首籤",
    origin: "龍山寺／佛寺系統",
    philosophy: "慈悲、留白、修行感",
    fortuneProfile: {
      positive: "約 60–70% 吉籤",
      neutral: "中籤比例高",
      negative: "極凶籤極少",
    },
  },
  {
    id: "sixty-jiazi",
    name: "六十甲子籤",
    origin: "媽祖／王爺系統",
    philosophy: "人生波動、時運與海洋文化",
    fortuneProfile: {
      positive: "約 60–70% 吉籤",
      neutral: "大量時運型籤詩",
      negative: "約三分之一偏凶或警示",
    },
  },
  {
    id: "leiyushi",
    name: "雷雨師籤",
    origin: "關帝／行天宮系統",
    philosophy: "義理、決策、因果與行動",
    fortuneProfile: {
      positive: "吉籤比例偏高",
      neutral: "結果傾向明確",
      negative: "凶籤比例約一成",
    },
  },
];

const GODS = [
  {
    id: "mazu",
    system: "sixty-jiazi",
    name: "媽祖",
    emoji: "🌊",
    vibe: "安定與陪伴",
    description: "適合在人生混亂、焦慮與不安時前來詢問。",
    oracle: [
      ...Array.from({ length: 60 }, (_, index) => {
        const number = index + 1;

        const defaultFortunes = [
          "上吉籤",
          "中吉籤",
          "警示籤",
          "晚成籤",
          "平運籤",
        ];

        const themes = [
          "時運未到",
          "等待轉機",
          "貴人靠近",
          "情緒混亂",
          "重新開始",
          "守成觀察",
          "因果循環",
          "人際磨合",
          "長期累積",
          "內在修復",
        ];

        const poemPool = [
          "雲開月出見天明，前路雖遙自有程。",
          "風波未定且安心，守得時來萬事成。",
          "花開花謝皆有運，不必強求問前因。",
          "浮沉進退皆天意，且向平安處用心。",
          "長夜過後終見日，莫因一時亂本心。",
        ];

        const advicePool = [
          "現在不適合躁進，先整理自己的節奏。",
          "很多事情正在醞釀，不需要急著證明自己。",
          "與其反覆問答案，不如先穩定生活與情緒。",
          "真正的轉機來自長期累積，而不是短期衝刺。",
          "你現在最需要的不是更多資訊，而是更安靜的判斷力。",
        ];

        return {
          id: `jiazi-${String(number).padStart(2, "0")}`,
          number,
          fortune: defaultFortunes[index % defaultFortunes.length],
          title: `第${number}籤【六十甲子】`,
          poem: poemPool[index % poemPool.length],
          meaning: `這是一支關於「${themes[index % themes.length]}」的籤。它不一定代表吉或凶，而是提醒你目前正處於人生某個轉換節點。`,
          advice: advicePool[index % advicePool.length],
          tags: [
            themes[index % themes.length],
            "東方命運觀",
            "人生節奏",
          ],
          story: ["民間傳說", "東方因果敘事"],
        };
      }),
      {
        id: "jiazi-56",
        number: 56,
        fortune: "警示籤",
        title: "第五六籤【癸卯】",
        poem:
          "病中若得苦心勞，到底完全總未遭。去後不須回頭問，心中事務盡消磨。",
        meaning:
          "這是一支 exhaustion 籤。代表長期耗損、burnout、反覆回頭檢查與內耗。很多事情不是努力不夠，而是已經過度消耗。",
        advice:
          "停止反覆 replay 過去。先休息、修復與抽離，才有可能重新前進。",
        tags: ["burnout", "內耗", "放下", "修復"],
        story: ["楊戩得病在西軒"],
      },
      {
        id: "jiazi-57",
        number: 57,
        fortune: "上吉籤",
        title: "第五七籤【癸巳】",
        poem:
          "勸君把定心莫虛，前途清吉得運時。到底中間無大事，又遇神仙守安居。",
        meaning:
          "這是一支 grounding 籤。很多問題來自焦慮與過度想像，而不是事情本身真的失控。",
        advice:
          "穩住自己的節奏與情緒。當內心穩定，事情會逐漸回到正軌。",
        tags: ["安心", "穩定", "神明護持", "焦慮"],
        story: ["白蛇精遇許漢文", "龐涓孫臏學法"],
      },
      {
        id: "jiazi-58",
        number: 58,
        fortune: "晚成籤",
        title: "第五八籤【癸未】",
        poem:
          "蛇身意欲變成龍，只恐命內運未通。久病且作寬心坐，言語雖多不可從。",
        meaning:
          "這是一支典型的『想升級但 timing 未到』的籤。野心很強，但外部條件尚未完全成熟。",
        advice:
          "不要被過量資訊與外界意見干擾。真正重要的是累積自己的底層能力。",
        tags: ["升級", "timing", "創業", "等待"],
        story: ["白蛇精詐言往南海", "袁達入昭國關"],
      },
      {
        id: "jiazi-59",
        number: 59,
        fortune: "吉籤",
        title: "第五九籤【癸酉】",
        poem:
          "有心作福莫遲疑，求名清吉正當時。此事必能成會合，財寶自然喜相隨。",
        meaning:
          "這是一支 alignment 籤。當人、資源與方向逐漸對齊時，事情會開始推進。",
        advice:
          "不要只停留在想法階段。現在適合合作、行動與建立長期連結。",
        tags: ["合作", "成局", "貴人", "資源匯聚"],
        story: ["皇都市上有神仙", "五鼠鬧東京"],
      },
      {
        id: "jiazi-60",
        number: 60,
        fortune: "中吉籤",
        title: "第六十籤【癸亥】",
        poem:
          "月出光輝本清吉，浮雲總是蔽陰色。戶內用心再作福，當官分理便有益。",
        meaning:
          "事情本來有機會，只是暫時被雜音與情緒遮蔽。核心問題不在命運，而在內部秩序是否穩定。",
        advice:
          "先整理生活、情緒與人際界線。很多答案會在安靜後浮現。",
        tags: ["月亮", "迷霧", "秩序", "修身"],
        story: ["薛剛踢死太子", "楊六婿斬子"],
      },
    ],
  },
  {
    id: "yuelao",
    system: "guanyin",
    name: "月老",
    emoji: "❤️",
    vibe: "感情與緣分",
    description: "適合詢問關係、曖昧、timing 與情感選擇。",
    oracle: [
      {
        id: "guanyin-03",
        number: 3,
        fortune: "下籤",
        title: "第三籤【燕子銜泥】",
        poem:
          "衝風冒雨去還歸，役役勞身似燕兒。啣得泥來呈疊後，到頭疊壞復成泥。",
        meaning:
          "這是一支『白忙一場』的籤。很多事情看似很努力，但方向、結構或 timing 不對，因此不斷重工與耗損。",
        advice:
          "不要只靠意志力硬撐。現在更重要的是重新判斷：這件事是否真的值得長耗久戰。",
        tags: ["內耗", "重工", "卡關", "耗損"],
        story: ["董永遇仙", "燕將獨守聊城"],
      },
      {
        id: "guanyin-04",
        number: 4,
        fortune: "上籤",
        title: "第四籤【破鏡重圓】",
        poem:
          "菱花鏡破復重圓，女再求夫男再婚。自此門閭重改換，更添福祿與兒孫。",
        meaning:
          "這是一支 relationship recovery 籤。代表曾經破裂、分離或失衡的關係，有重新修復與開始的可能。",
        advice:
          "真正重要的不是過去發生什麼，而是雙方是否已經成熟到能重新建立新的秩序。",
        tags: ["復合", "修復", "感情", "重啟"],
        story: ["玉蓮會十朋"],
      },
      {
        id: "guanyin-05",
        number: 5,
        fortune: "中籤",
        title: "第五籤【掘地求泉】",
        poem:
          "一鋤掘地要求泉，努力求之得最先。無意俄然遇知己，相逢攜手上青天。",
        meaning:
          "這是一支『先難後易』的籤。代表真正有價值的事情，需要時間與耐心，但關鍵貴人可能會在意想不到時出現。",
        advice:
          "不要因為短期沒有結果就放棄。真正重要的 connection 往往不是強求來的。",
        tags: ["貴人", "長期累積", "合作", "轉機"],
        story: ["劉晨遇仙", "燕昭王築黃金臺"],
      },
      {
        id: "guanyin-06",
        number: 6,
        fortune: "中籤",
        title: "第六籤【投岩銅鳥】",
        poem:
          "投身巖下飼於菟，須是還他大丈夫。捨己也應難再得，通行天下此人無。",
        meaning:
          "這是一支關於 courage 與格局的籤。代表局勢困難，但真正能扛責任與維持原則的人很少。",
        advice:
          "不要只想短期利益。現在考驗的是人格、膽識與長期信任。",
        tags: ["膽識", "責任", "信任", "格局"],
        story: ["薛仁貴遇主", "藺相如完璧歸趙"],
      },
      {
        id: "yuelao-12",
        title: "第十二籤",
        poem: "花開花謝皆有時，莫向東風怨別離。",
        meaning:
          "這段關係不是沒有感情，而是兩人的節奏不同。有人在靠近，有人在觀望。",
        advice: "不要急著確認關係。先確認彼此是否真的理解對方。",
      },
      {
        id: "yuelao-23",
        title: "第二十三籤",
        poem: "有心栽柳柳難成，無意插花花自明。",
        meaning:
          "越用力抓住的人，越容易失去。真正適合的關係，通常是自然長出來的。",
        advice:
          "停止過度分析訊息與反應。去觀察對方是否願意穩定出現在你的生活裡。",
      },
    ],
  },
  {
    id: "guangong",
    system: "leiyushi",
    name: "關聖帝君",
    emoji: "⚔️",
    vibe: "事業與決策",
    description: "適合詢問合作、創業、判斷與信任。",
    oracle: [
      {
        id: "guangong-46",
        title: "第四十六籤",
        poem: "寶劍光芒出匣時，群邪退散正當宜。",
        meaning:
          "你其實已經知道問題在哪裡，只是一直不願意正面處理。",
        advice:
          "不要再拖延。該切割的人脈、合作與結構，現在就處理。",
      },
      {
        id: "guangong-07",
        title: "第七籤",
        poem: "行船莫怕風波急，掌穩舵盤自有成。",
        meaning:
          "外部環境很亂，但真正決定結果的是你的節奏與判斷。",
        advice: "先守現金流與核心資源，不要被短期聲量誘惑。",
      },
    ],
  },
];

function getRandomOracle(god) {
  if (!god || !Array.isArray(god.oracle) || god.oracle.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * god.oracle.length);
  return god.oracle[randomIndex];
}

export default function EasternOracleApp() {
  const [selectedGodId, setSelectedGodId] = useState(GODS[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [oracleResult, setOracleResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const timeoutRef = useRef(null);

  const selectedGod = useMemo(() => {
    return GODS.find((god) => god.id === selectedGodId) ?? GODS[0] ?? null;
  }, [selectedGodId]);

  const selectedSystem = useMemo(() => {
    if (!selectedGod) {
      return ORACLE_SYSTEMS[0] ?? null;
    }

    return (
      ORACLE_SYSTEMS.find((system) => system.id === selectedGod.system) ??
      ORACLE_SYSTEMS[0] ??
      null
    );
  }, [selectedGod]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const drawOracle = () => {
    if (loading || !selectedGod) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const trimmedQuestion = question.trim();

    setLoading(true);

    timeoutRef.current = window.setTimeout(() => {
      const result = getRandomOracle(selectedGod);

      if (!result) {
        setLoading(false);
        return;
      }

      const currentTime = new Date().toLocaleString();

      const nextResult = {
        ...result,
        god: selectedGod.name,
        emoji: selectedGod.emoji,
        question: trimmedQuestion,
        time: currentTime,
      };

      setOracleResult(nextResult);

      setHistory((previousHistory) => [
        {
          id: `${result.id}-${Date.now()}`,
          god: selectedGod.name,
          title: result.title,
          question: trimmedQuestion,
          time: currentTime,
        },
        ...previousHistory,
      ]);

      setLoading(false);
      timeoutRef.current = null;
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-12 flex flex-col gap-4">
          <div className="text-xs uppercase tracking-[0.35em] text-stone-400">
            Eastern Oracle System
          </div>

          <h1 className="font-serif text-5xl leading-tight md:text-7xl">
            數位籤詩宇宙
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-stone-300">
            不是算命網站，而是一個讓人在混亂時重新整理情緒、問題與人生方向的東方 ritual interface。
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div>
              <div className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
                Select Your Oracle
              </div>

              {selectedSystem ? (
                <div className="mb-6 rounded-3xl border border-stone-800 bg-stone-900/70 p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="mb-2 text-xs uppercase tracking-[0.25em] text-stone-500">
                        Oracle System
                      </div>

                      <div className="font-serif text-2xl text-stone-100">
                        {selectedSystem.name}
                      </div>
                    </div>

                    <div className="rounded-full border border-stone-700 px-4 py-2 text-xs text-stone-400">
                      {selectedSystem.origin}
                    </div>
                  </div>

                  <p className="mb-5 max-w-2xl text-sm leading-relaxed text-stone-300">
                    {selectedSystem.philosophy}
                  </p>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-stone-800 bg-black/20 p-4">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                        吉籤傾向
                      </div>

                      <div className="text-sm text-stone-200">
                        {selectedSystem.fortuneProfile.positive}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-stone-800 bg-black/20 p-4">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                        中性結構
                      </div>

                      <div className="text-sm text-stone-200">
                        {selectedSystem.fortuneProfile.neutral}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-stone-800 bg-black/20 p-4">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                        凶籤比例
                      </div>

                      <div className="text-sm text-stone-200">
                        {selectedSystem.fortuneProfile.negative}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                {GODS.map((god) => {
                  const isSelected = selectedGod?.id === god.id;

                  return (
                    <button
                      key={god.id}
                      type="button"
                      onClick={() => {
                        setSelectedGodId(god.id);
                        setOracleResult(null);
                      }}
                      className={`rounded-3xl border p-6 text-left transition-all duration-300 backdrop-blur ${
                        isSelected
                          ? "scale-[1.02] border-white bg-white/10"
                          : "border-stone-800 bg-stone-900 hover:border-stone-500"
                      }`}
                    >
                      <div className="mb-4 text-4xl">{god.emoji}</div>

                      <div className="mb-2 font-serif text-2xl">
                        {god.name}
                      </div>

                      <div className="mb-3 text-sm text-stone-400">
                        {god.vibe}
                      </div>

                      <p className="text-sm leading-relaxed text-stone-300">
                        {god.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-stone-800 bg-stone-900/80 p-6 md:p-8">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="mb-2 text-sm uppercase tracking-[0.3em] text-stone-500">
                    Your Question
                  </div>

                  <h2 className="font-serif text-2xl">今天想問什麼？</h2>
                </div>
              </div>

              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="例如：這段合作是否值得繼續？我該不該放下這段關係？現在是不是適合創業？"
                className="h-40 w-full resize-none rounded-2xl border border-stone-800 bg-stone-950 p-5 text-stone-100 placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-500"
              />

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-md text-sm leading-relaxed text-stone-500">
                  抽籤不是預言未來，而是幫你重新看見自己的內心與處境。
                </div>

                <button
                  type="button"
                  disabled={loading || !selectedGod}
                  onClick={drawOracle}
                  className="rounded-full bg-white px-8 py-4 font-medium text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100"
                >
                  {loading ? "神明正在回應中⋯" : "抽一支籤"}
                </button>
              </div>
            </div>

            {oracleResult ? (
              <div className="relative overflow-hidden rounded-[2rem] border border-stone-700 bg-gradient-to-b from-stone-900 to-stone-950 p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.15),transparent_50%)] opacity-20" />

                <div className="relative z-10">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="text-4xl">{oracleResult.emoji}</div>

                    <div>
                      <div className="text-sm text-stone-400">
                        {oracleResult.god}
                      </div>

                      <div className="font-serif text-2xl">
                        {oracleResult.title}
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 border-l-2 border-stone-600 pl-6">
                    <div className="font-serif text-2xl leading-loose text-stone-100 md:text-3xl">
                      {oracleResult.poem}
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6">
                      <div className="mb-4 text-xs uppercase tracking-[0.25em] text-stone-500">
                        Oracle Reading
                      </div>

                      <p className="leading-relaxed text-stone-200">
                        {oracleResult.meaning}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-stone-800 bg-stone-900 p-6">
                      <div className="mb-4 text-xs uppercase tracking-[0.25em] text-stone-500">
                        Guidance
                      </div>

                      <p className="leading-relaxed text-stone-200">
                        {oracleResult.advice}
                      </p>
                    </div>
                  </div>

                  {oracleResult.question ? (
                    <div className="mt-8 rounded-2xl border border-stone-800 bg-black/30 p-5">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-stone-500">
                        Your Question
                      </div>

                      <div className="break-words text-stone-300">
                        {oracleResult.question}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
              <div className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
                Product Vision
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-stone-300">
                <p>這不是傳統命理站，而是「東方情緒介面」。</p>

                <p>
                  使用 ritual、神明 worldview 與高品質敘事，建立一種更有文化感與陪伴感的數位體驗。
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
              <div className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
                Future Features
              </div>

              <div className="space-y-3 text-sm text-stone-300">
                <div>• 同題問不同神</div>
                <div>• 籤詩流派資料庫</div>
                <div>• AI 解籤人格系統</div>
                <div>• 不同神明的語氣模型</div>
                <div>• 夢境與流年記錄</div>
                <div>• 收藏與分享卡片</div>
                <div>• 宮廟文化地圖</div>
                <div>• 東方 spiritual journal</div>
                <div>• 多語言版本（日 / 韓 / 英）</div>
              </div>
            </div>

            <div className="rounded-3xl border border-stone-800 bg-stone-900 p-6">
              <div className="mb-4 text-sm uppercase tracking-[0.3em] text-stone-500">
                Recent Readings
              </div>

              <div className="max-h-[400px] space-y-3 overflow-auto pr-2">
                {history.length === 0 ? (
                  <div className="text-sm text-stone-500">尚未抽籤。</div>
                ) : (
                  history.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-stone-800 bg-black/20 p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="font-serif text-lg">{item.title}</div>

                        <div className="text-right text-xs text-stone-500">
                          <div>{item.god}</div>
                          <div>{item.time}</div>
                        </div>
                      </div>

                      <div className="break-words text-sm text-stone-400">
                        {item.question || "未輸入問題"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
