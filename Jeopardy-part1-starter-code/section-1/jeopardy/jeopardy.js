const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

let score = 0;
let categories = [];


/** get random category IDs */
async function getCategoryIds() {
  const res = await axios.get(
    `https://rithm-jeopardy.herokuapp.com/api/categories?count=100`
  );

  const allCategories = res.data;

  // shuffle and pick 6
  return _.sampleSize(allCategories, NUM_CATEGORIES).map(c => c.id);
}

/** get category info */
async function getCategory(catId) {
  const res = await axios.get(
    `https://rithm-jeopardy.herokuapp.com/api/category?id=${catId}`
  );

  const cat = res.data;

  return {
    title: cat.title,
    clues: _.sampleSize(cat.clues, NUM_CLUES_PER_CAT).map(clue => ({
      question: clue.question,
      answer: clue.answer,
      showing: null
    }))
  };
}

/** fill the HTML table */
async function fillTable() {
  const $jeopardy = $("#jeopardy");
  $jeopardy.empty();

  const $thead = $("<thead>");
  const $headRow = $("<tr>");

  // add category titles
  for (let cat of categories) {
    $headRow.append(`<th>${cat.title}</th>`);
  }

  $thead.append($headRow);
  $jeopardy.append($thead);

  // body
  const $tbody = $("<tbody>");

  for (let i = 0; i < NUM_CLUES_PER_CAT; i++) {
    const $row = $("<tr>");

    for (let j = 0; j < categories.length; j++) {
      $row.append(`
        <td class="clue" id="${j}-${i}">
          ?
        </td>
      `);
    }

    $tbody.append($row);
  }

  $jeopardy.append($tbody);
}

/** handle click */
function handleClick(evt) {
  const id = $(evt.target).attr("id");
  if (!id) return;

  const [catIdx, clueIdx] = id.split("-");
  const clue = categories[catIdx].clues[clueIdx];

  if (clue.showing === null) {
    $(evt.target).text(clue.question);
    clue.showing = "question";

    // Add input field and hint button
    const inputDiv = $("#answer-input");
    inputDiv.show();
    inputDiv.html(`<div><input type="text" id="answer-field" placeholder="Your answer"><button id="submit-answer">Submit</button></div><button id="hint-button" class="hint-btn">Show Hint</button><div id="hint-box" style="display:none; margin-top: 10px; padding: 10px; background-color: #ffd700; border-radius: 5px;"></div>`);

    // Start timer
    let timer = setTimeout(() => {
      // Show answer as hint
      $(evt.target).text(clue.answer);
      setTimeout(() => {
        $(evt.target).text(clue.question);
        clue.showing = null;
        inputDiv.hide();
      }, 2000); // show answer for 2 seconds, then back
    }, 10000); // 10 seconds

    // On hint button click
    $("#hint-button").one("click", function() {
      const hintBox = $("#hint-box");
      hintBox.text(clue.answer);
      hintBox.show();
      $(this).prop("disabled", true);
      
      setTimeout(() => {
        hintBox.hide();
        $("#hint-button").prop("disabled", false);
      }, 10000);
    });

    // On submit
    $("#submit-answer").one("click", function() {
      clearTimeout(timer);
      const userAnswer = $("#answer-field").val().trim();
      inputDiv.hide();
      if (userAnswer.toLowerCase().includes(clue.answer.toLowerCase())) {
        score += 100;
        const scoreEl = $("#score");
        scoreEl.text(score);
        scoreEl.addClass("graffiti-drop");
        setTimeout(() => {
          scoreEl.removeClass("graffiti-drop");
        }, 1000);
        $(evt.target).css("background-color", "#28a200");
        clue.showing = "answered";
      } else {
        console.log("incorrect");
        $(evt.target).css("background-color", "#8d2ab5");
        $(evt.target).text(`INCORRECT\n\nCorrect Answer: ${clue.answer}`);
        clue.showing = "answered";
      }
    });
  }
}

/** loading UI */

function showLoadingView() {
  $("#jeopardy").hide();
  $("#loading").show();
  $("#start").text("Loading...");
}


/** hide loading */
function hideLoadingView() {
  $("#loading").hide();
  $("#jeopardy").show();
  $("#start").text("Restart!");
}

/** setup game */
async function setupAndStart() {
  showLoadingView();

  score = 0;
  $("#score").text(score);

  categories = [];

  const catIds = await getCategoryIds();

  for (let id of catIds) {
    categories.push(await getCategory(id));
  }

  await fillTable();

  hideLoadingView();
}

/** event listeners */

// start button
$("#start").on("click", function () {
  setupAndStart();
});

// click board
$("#jeopardy").on("click", ".clue", handleClick);