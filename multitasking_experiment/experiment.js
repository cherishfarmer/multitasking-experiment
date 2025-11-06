// Multitasking Experiment - prototype
const jsPsych = initJsPsych({
  on_finish: function() {
    // show a link to download data (participant can copy it)
    jsPsych.data.displayData();
  }
});

let timeline = [];

// Random assignment to 1 of 4 conditions (between-subjects)
// 1 == Same Source - Easy
// 2 == Same Source - Hard
// 3 == Different Source - Easy
// 4 == Different Source - Hard
// (this is to help us with data collection, numbers are for participants so they don't get an idea of what
// the other conditions are like)
const conditions = [
  {source: "same", difficulty: "easy", label: "1"},
  {source: "same", difficulty: "hard", label: "2"},
  {source: "different", difficulty: "easy", label: "3"},
  {source: "different", difficulty: "hard", label: "4"}
];
const condition = jsPsych.randomization.sampleWithoutReplacement(conditions, 1)[0];
jsPsych.data.addProperties({ condition: condition.label });

// Fullscreen intro
const fullscr = {
  type: jsPsychHtmlButtonResponse,
  stimulus: "<h2>Welcome</h2><p>We will open full-screen for the experiment. Press continue to begin.</p>",
  choices: ["Continue"],
  on_finish: function() {
    jsPsych.getDisplayElement().requestFullscreen().catch(()=>{});
  }
};
timeline.push(fullscr);

// Instructions
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: `
    <h2>Multitasking Experiment</h2>
    <p>You will read passages and answer brief questions (primary task).</p>
    <p>Every 2 minutes you'll be interrupted with a 1-minute secondary task.</p>
    <p>The experiment will last ~15 minutes. Try your best on both tasks.</p>
  `,
  choices: ['Begin']
});

// Persistent primary state (so the participant resumes where they left off)
let primaryState = {
  scrollPos: 0,
  answers: {}
};

let secondaryState = {
  found: new Set()
};

function primaryTask(passage, questions) {
  return {
    timeline: [
      {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: () => {
          // Build question list HTML
          const questionHTML = questions.map((q, idx) => {
            const savedAnswer = primaryState.answers[q.prompt] || "";
            return `
              <div style="margin-bottom:1em; border-bottom:1px solid #ddd; padding-bottom:0.5em;">
                <p><b>Q${idx + 1}: ${q.prompt}</b></p>
                ${q.choices.map(choice => `
                  <label style="display:block; margin:4px 0;">
                    <input type="radio" 
                           name="q_${idx}" 
                           value="${choice}" 
                           ${savedAnswer === choice ? "checked" : ""}>
                    ${choice}
                  </label>
                `).join("")}
              </div>
            `;
          }).join("");

          return `
            <div style="display:flex; height:75vh; gap:1em;">
              <div id="passage-panel" 
                   style="flex:1; border:1px solid #ccc; padding:1em; overflow-y:auto; text-align:left;">
                <h3>Reading Passage</h3>
                <p style="white-space:pre-wrap;">${passage}</p>
              </div>

              <div id="question-panel" 
                   style="flex:1; border:1px solid #ccc; padding:1em; overflow-y:auto; text-align:left;">
                <h3>Questions</h3>
                ${questionHTML}
              </div>
            </div>
          `;
        },
        choices: "NO_KEYS", // no user advance
        trial_duration: 2 * 60 * 1000, // auto advance after 2 minutes
        on_load: () => {
          // restore scroll position
          const scrollEl = document.getElementById("passage-panel");
          if (scrollEl) scrollEl.scrollTop = primaryState.scrollPos;

          // handle scroll tracking
          document.getElementById("passage-panel").addEventListener("scroll", e => {
            primaryState.scrollPos = e.target.scrollTop;
          });

          // handle radio button changes
          document.querySelectorAll('input[type="radio"]').forEach(el => {
            el.addEventListener('change', e => {
              const questionText = e.target.closest("div").querySelector("p b").textContent.replace(/^Q\d+:\s*/, "");
              primaryState.answers[questionText] = e.target.value;
            });
          });
        },
        on_finish: data => {
          // record all question responses
          const responses = {};
          let correctCount = 0;
          questions.forEach(q => {
            const ans = primaryState.answers[q.prompt] || "";
            responses[q.prompt] = ans;
            if (ans.toLowerCase() === q.correctAnswer.toLowerCase()) correctCount++;
          });

          data.responses = responses;
          data.correctCount = correctCount;
          data.totalQuestions = questions.length;
          data.task = "primary";
          data.scrollPos = primaryState.scrollPos;
          console.log("Answers:", primaryState.answers);
        }
      }
    ]
  };
}

// May not be perfect on all screens, had to adjust because of formatting from source from pulled from
const passages = [
  primaryTask(
      "1            One crucial element of the beauty of the tulip that\n" +
      "2    intoxicated the Dutch, the Turks, the French, and the\n" +
      "3    English has been lost to us. To them the tulip was a\n" +
      "4    magic flower because it was prone to spontaneous and\n" +
      "5    brilliant eruptions of color. In a planting of a hundred\n" +
      "6    tulips, one of them might be so possessed, opening to\n" +
      "7    reveal the white or yellow ground of its petals painted,\n" +
      "8    as if by the finest brush and steadiest hand, with intricate feathers or flames of a vividly contrasting hue.\n" +
      "9    When this happened, the tulip was said to have\n" +
      "10   “broken,” and if a tulip broke in a particularly striking\n" +
      "11   manner—if the flames of the applied color reached\n" +
      "12   clear to the petal’s lip, say, and its pigment was brilliant and pure and its pattern symmetrical—the owner\n" +
      "13   of that bulb had won the lottery. For the offsets of that\n" +
      "14   bulb would inherit its pattern and hues and command a\n" +
      "15   fantastic price. The fact that broken tulips for some\n" +
      "16   unknown reason produced fewer and smaller offsets\n" +
      "17   than ordinary tulips drove their prices still higher.\n" +
      "18   Semper Augustus was the most famous such break.\n" +
      "19           The closest we have to a broken tulip today is the\n" +
      "20   group known as the Rembrandts—so named because\n" +
      "21   Rembrandt painted some of the most admired breaks of\n" +
      "22   his time. But these latter-day tulips, with their heavy\n" +
      "23   patterning of one or more contrasting colors, look\n" +
      "24   clumsy by comparison, as if painted in haste with a\n" +
      "25 thick brush. To judge from the paintings we have of the\n" +
      "26   originals, the petals of broken tulips could be as fine\n" +
      "27   and intricate as marbleized papers, the extravagant\n" +
      "28   swirls of color somehow managing to seem both bold\n" +
      "29   and delicate at once. In the most striking examples—\n" +
      "30 such as the fiery carmine that Semper Augustus\n" +
      "31   splashed on its pure white ground—the outbreak of\n" +
      "32   color juxtaposed with the orderly, linear form of the\n" +
      "33   tulip could be breathtaking, with the leaping, wayward\n" +
      "34   patterns just barely contained by the petal’s edge.\n" +
      "35           Anna Pavord recounts the extraordinary lengths to\n" +
      "36   which Dutch growers would go to make their tulips\n" +
      "37   break, sometimes borrowing their techniques from\n" +
      "38   alchemists, who faced what must have seemed a comparable challenge. Over the earth above a bed planted\n" +
      "39   with white tulips, gardeners would liberally sprinkle\n" +
      "40 paint powders of the desired hue, on the theory that\n" +
      "41   rainwater would wash the color down to the roots,\n" +
      "42   where it would be taken up by the bulb. Charlatans sold\n" +
      "43   recipes believed to produce the magic color breaks;\n" +
      "44   pigeon droppings were thought to be an effective agent,\n" +
      "45 as was plaster dust taken from the walls of old houses.\n" +
      "46   Unlike the alchemists, whose attempts to change base\n" +
      "47   metals into gold reliably failed, now and then the\n" +
      "48   would-be tulip changers would be rewarded with a\n" +
      "49   good break, inspiring everybody to redouble their\n" +
      "50   efforts.\n" +
      "51           What the Dutch could not have known was that a\n" +
      "52   virus was responsible for the magic of the broken tulip,\n" +
      "53   a fact that, as soon as it was discovered, doomed the\n" +
      "54   beauty it had made possible. The color of a tulip actu- ally consists of two pigments working in concert—a\n" +
      "55   base color that is always yellow or white and a second,\n" +
      "56   laid-on color called an anthocyanin; the mix of these\n" +
      "57   two hues determines the unitary color we see. The virus\n" +
      "58   works by partially and irregularly suppressing the\n" +
      "59   anthocyanin, thereby allowing a portion of the underlying color to show through. It wasn’t until the 1920s,\n" +
      "60   after the invention of the electron microscope, that scientists discovered the virus was being spread from tulip\n" +
      "61   to tulip by Myzus persicae, the peach potato aphid.\n" +
      "62   Peach trees were a common feature of seventeenthcentury gardens.\n" +
      "63           By the 1920s the Dutch regarded their tulips as\n" +
      "64   commodities to trade rather than jewels to display, and\n" +
      "65   since the virus weakened the bulbs it infected (the\n" +
      "66   reason the offsets of broken tulips were so small and\n" +
      "67   few in number), Dutch growers set about ridding their\n" +
      "68   fields of the infection. Color breaks, when they did\n" +
      "69   occur, were promptly destroyed, and a certain peculiar\n" +
      "70   manifestation of natural beauty abruptly lost its claim\n" +
      "71   on human affection.\n" +
      "72           I can’t help thinking that the virus was supplying\n" +
      "73   something the tulip needed, just the touch of abandon\n" +
      "74   the flower’s chilly formality called for. Maybe that’s\n" +
      "75   why the broken tulip became such a treasure in\n" +
      "76   seventeenth-century Holland: the wayward color loosed\n" +
      "77   on a tulip by a good break perfected the flower, even as\n" +
      "78   the virus responsible set about destroying it.\n" +
      "79           On its face the story of the virus and the tulip\n" +
      "80   would seem to throw a wrench into any evolutionary\n" +
      "81   understanding of beauty.",
      [{
        prompt: "The main purpose of the passage is to:",
        choices: [
          "A. highlight changes in the flower industry from the seventeenth century through today.",
          "B. examine the way certain plants have been represented in art over the centuries.",
          "C. provide an overview of plant viruses and the way they affect the flower market.",
          "D. explain a particular flower variation and how it has been perceived historically."
        ],
        correctAnswer: "D. explain a particular flower variation and how it has been perceived historically."
      },
      {
        prompt: "The main point of the second paragraph (lines 19–34) is that:",
        choices: [
          "F. modern Rembrandt tulips have been painted by many of today’s most famous artists.",
          "G. compared to seventeenth-century broken tulips, today’s multicolored tulips are less visually appealing.",
          "H. the tulip break known as Semper Augustus was a striking example of the seventeenth-century broken tulip.",
          "J. Rembrandt was responsible for painting the most famous tulip breaks of his time."
        ],
        correctAnswer: "H. the tulip break known as Semper Augustus was a striking example of the seventeenth-century broken tulip."
      },
      {
        prompt: "It can reasonably be inferred from the passage that some seventeenth-century tulip growers believed tulip breaks were mainly caused by:",
        choices: [
          "A. suppliers’ storage conditions.",
          "B. diseased tulip bulbs.",
          "C. certain growing techniques.",
          "D. certain weather patterns."
        ],
        correctAnswer: "C. certain growing techniques."
      },
      {
        prompt: "The information in lines 54–59 primarily functions to:",
        choices: [
          "F. describe the range of potential tulip colors.",
          "G. explain how the color variation in a broken tulip occurs.",
          "H. argue that yellow and white are the only natural tulip colors.",
          "J. indicate why broken tulips contain no anthocyanin."
        ],
        correctAnswer: "G. explain how the color variation in a broken tulip occurs."
      },
      {
        prompt: "The sixth paragraph (lines 72–78) differs from the rest of the passage in that it:",
        choices: [
          "A. questions whether the virus that caused broken tulips was harmful to bulbs.",
          "B. argues that growers should have dealt with broken tulips differently.",
          "C. challenges the idea that broken tulips were beautiful.",
          "D. presents a personal meditation on broken tulips."
        ],
        correctAnswer: "D. presents a personal meditation on broken tulips."
      },
      {
        prompt: "According to the passage, in the seventeenth century, the fact that broken tulip bulbs tended to produce fewer and smaller offsets compared to typical tulip bulbs resulted in:",
        choices: [
          "F. a decrease in the demand for broken tulips.",
          "G. a fear among growers that broken tulips were diseased.",
          "H. an increase in prices for broken tulips.",
          "J. a desire among growers to plant a wider variety of crops."
        ],
        correctAnswer: "H. an increase in prices for broken tulips."
      },
      {
        prompt: "In the passage, the author compares broken tulips as they are represented in Rembrandt’s paintings to:",
        choices: [
          "A. peach-tree blossoms.",
          "B. paint powders sprinkled on the ground.",
          "C. a painting hastily done with a thick brush.",
          "D. intricately marbleized papers."
        ],
        correctAnswer: "D. intricately marbleized papers."
      },
      {
        prompt: "The passage author most likely mentions that peach trees were a staple of seventeenth-century gardens to:",
        choices: [
          "F. highlight a crop favored by growers who did not cultivate tulips.",
          "G. emphasize that peach trees are not as popular in gardens today.",
          "H. explain how peach potato aphids spread the tulip virus.",
          "J. compare tulips to another popular seventeenth-century crop."
        ],
        correctAnswer: "H. explain how peach potato aphids spread the tulip virus."
      },
      {
        prompt: "As it is used in line 73, the word 'abandon' most nearly means:",
        choices: [
          "A. uninhibitedness.",
          "B. relinquishment.",
          "C. retreat.",
          "D. denial."
        ],
        correctAnswer: "A. uninhibitedness."
      }]
  )
];

// Secondary task generators
function wordSearchTask(difficulty) {
  const validWords = ["aardvark", "ant", "badger", "bat", "bear", "cheetah",
    "crocodile", "crow", "dinosaur", "doe", "dolphin", "eel", "fish", "hedgehog", "hamster", "mole",
    "ostrich", "pony", "rabbit", "rat", "raven", "zebra"];

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
      <div style="display:flex;gap:30px;width:90%;margin:auto;">
        <div style="flex:1;text-align:center;">
          <img src="assets/${difficulty}_wordsearch.png" style="max-width:100%;height:auto;">
          <p>Type a word you found:</p>
          <input type="text" id="found-word" style="width:80%;padding:6px;font-size:16px;" />
        </div>
        <div id="word-list" style="flex:1;border-left:2px solid #ccc;padding-left:20px;overflow-y:auto;height:400px;">
          <h3>Words Found</h3>
        </div>
      </div>
    `,
    choices: "NO_KEYS",
    trial_duration: 1 * 60 * 1000, // auto-advance after 1 minute
    on_load: function () {
      const input = document.getElementById("found-word");
      const wordListEl = document.getElementById("word-list");
      input.focus();

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          const word = input.value.trim().toLowerCase();
          input.value = "";
          if (word && validWords.includes(word) && !secondaryState.found.has(word)) {
            secondaryState.found.add(word);
            const newEntry = document.createElement("div");
            newEntry.textContent = `✔ ${word}`;
            wordListEl.appendChild(newEntry);
          } else if (word) {
            const msg = document.createElement("div");
            msg.textContent = `✖ ${word} (invalid/duplicate)`;
            msg.style.color = "gray";
            wordListEl.appendChild(msg);
          }
          wordListEl.scrollTop = wordListEl.scrollHeight;
        }
      });
    },
    on_finish: function (data) {
      data.task = "secondary";
      data.secondary_type = "word_search";
      data.difficulty = difficulty;
      data.found_words = Array.from(secondaryState.found);
    }
  };
}


function spotDiffTask(difficulty) {
  const differences = [
    { x: 0.3, y: 0.4, width: 0.05, height: 0.05 },
    { x: 0.55, y: 0.2, width: 0.05, height: 0.05 },
    { x: 0.7, y: 0.75, width: 0.05, height: 0.05 }
  ];

  return {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() {
      const imgSrc = `assets/${difficulty}_finddiff.png`;
      return `
        <div style="position:relative;width:80%;margin:auto;">
          <img id="diff-img" src="${imgSrc}" style="width:100%;height:auto;">
          <div id="click-layer" style="position:absolute;top:0;left:0;width:100%;height:100%;"></div>
        </div>
        <p style="text-align:center;">Click on differences (auto-advances after 1 minute)</p>
        <div id="found-count" style="text-align:center;margin-top:10px;">Found: 0 / ${differences.length}</div>
      `;
    },
    choices: "NO_KEYS",
    trial_duration: 1 * 60 * 1000,
    on_load: function() {
      const img = document.getElementById("diff-img");
      const layer = document.getElementById("click-layer");
      const countDisplay = document.getElementById("found-count");

      layer.addEventListener("click", function(e) {
        const rect = img.getBoundingClientRect();
        const xRel = (e.clientX - rect.left) / rect.width;
        const yRel = (e.clientY - rect.top) / rect.height;

        differences.forEach((diff, i) => {
          if (!secondaryState.found.has(i)) {
            if (
                xRel >= diff.x && xRel <= diff.x + diff.width &&
                yRel >= diff.y && yRel <= diff.y + diff.height
            ) {
              secondaryState.found.add(i);
              countDisplay.textContent = `Found: ${secondaryState.found.size} / ${differences.length}`;
            }
          }
        });
      });
    },
    on_finish: function(data) {
      data.task = "secondary";
      data.secondary_type = "spot_difference";
      data.difficulty = difficulty;
      data.found_count = secondaryState.found.size;
      data.total_diffs = differences.length;
    }
  };
}



// Alternate primary (2 min) and secondary (1 min) until 15 minutes
const totalMinutes = 15; // change for debugging
const primaryDuration = 2 * 60 * 1000; // 2 minutes
const secondaryDuration = 1 * 60 * 1000; // 1 minute
let elapsedMs = 0;

while (elapsedMs < totalMinutes * 60 * 1000) {
  // Primary task
  timeline.push({
    ...passages[0].timeline[0], // use your exact passage
    trial_duration: Math.min(primaryDuration, totalMinutes * 60 * 1000 - elapsedMs)
  });
  elapsedMs += primaryDuration;
  if (elapsedMs >= totalMinutes * 60 * 1000) break;

  // Secondary task
  const secondaryTask = condition.source === "same" ? wordSearchTask(condition.difficulty) : spotDiffTask(condition.difficulty);
  timeline.push({
    ...secondaryTask,
    trial_duration: Math.min(secondaryDuration, totalMinutes * 60 * 1000 - elapsedMs)
  });
  elapsedMs += secondaryDuration;
  console.log(elapsedMs);
  console.log(totalMinutes * 60 * 1000);
}



// Exit fullscreen on finish and show results
const results_screen = {
  type: jsPsychHtmlButtonResponse,
  stimulus: function(){
    const prim = jsPsych.data.get().filter({ task: 'primary' });

    // Sum correct answers and total questions across all primary trials
    let correct = 0;
    let total = 0;
    prim.values().forEach(trial => {
      correct += trial.correctCount || 0;
      total += trial.totalQuestions || 0;
    });

    const accuracy = total > 0 ? ((correct / total) * 100).toFixed(1) : "0.0";

    const csv = jsPsych.data.get().csv();
    const enc = encodeURIComponent(csv);
    return `
      <h2>Experiment Complete</h2>
      <p>Your assigned condition: <strong>${condition.label}</strong></p>
      <p>Primary task accuracy: <strong>${accuracy}%</strong> (${correct}/${total})</p>
      <p><iframe src="https://docs.google.com/forms/d/e/1FAIpQLSckINUyDEXo5yF_w-URAd2d84lNes-axzk39I5-9MuaGzJIVw/viewform?embedded=true" width="640" height="840" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe></p>
      <p>When finished, click Finish.</p>
    `;
  },
  choices: ['Finish'],
  on_start: function(){
    // ensure fullscreen exit after finishing timeline
  },
  on_finish: function(){
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(()=>{});
    }
  }
};

timeline.push(results_screen);

// Add a bit of cleanup/instructions at end (optional)
timeline.push({
  type: jsPsychHtmlButtonResponse,
  stimulus: "<p>Thank you for participating. You may close this window.</p>",
  choices: ["Close"]
});

jsPsych.run(timeline).then(()=>{
  // After run, attach copy button behavior
  setTimeout(()=>{
    const copyBtn = document.getElementById('copyBtn');
    if(copyBtn){
      copyBtn.addEventListener('click', ()=>{
        const csvbox = document.getElementById('csvbox');
        if(csvbox){
          navigator.clipboard.writeText(csvbox.value).then(()=>{ alert('Data copied to clipboard'); });
        }
      });
    }
  }, 500);
});
