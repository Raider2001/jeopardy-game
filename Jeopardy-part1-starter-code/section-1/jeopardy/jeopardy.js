const NUM_CATEGORIES = 6;
const NUM_CLUES_PER_CAT = 5;

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
  } else if (clue.showing === "question") {
    $(evt.target).text(clue.answer);
    clue.showing = "answer";
  }
}

/** loading UI */
function showLoadingView() {
  $("#jeopardy").hide();
  $("#start").text("Loading...");
}

/** hide loading */
function hideLoadingView() {
  $("#jeopardy").show();
  $("#start").text("Restart!");
}

/** setup game */
async function setupAndStart() {
  showLoadingView();

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