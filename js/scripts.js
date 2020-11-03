/*
Akash Kumar, Yahtzee Project, October 2019

EC:
  1) Yahtzee Bonus
  2) Suggesting all applicable category totals after each roll (in an additional column)
  3) Highlight the best suggestion(s) in green.
  4) Animate dice rolls.
  5) High score.
  6) Additional column including expected value for categories so that the user knows whether or not a category's score is relatively good or bad.

Citations:
  The data used for EC 6 is from https://en.wikipedia.org/wiki/Yahtzee#Optimal_strategy.
  The CSS for the rainbow-colored title is from https://rainbowcoding.com/2011/12/02/how-to-create-rainbow-text-in-html-css-javascript/.

*/



console.log("scripts.js loaded!");
highScore();

//--------------------------Variable Declarations-----------------------//
const category_ids = {//object of strings
  "upper": ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'],
  "lower": ["3-of-a-kind", "4-of-a-kind", "full-house", "small-straight", "large-straight", "yahtzee", "chance"]
}
const all_category_ids = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes', "3-of-a-kind", "4-of-a-kind", "full-house", "small-straight", "large-straight", "yahtzee", "chance"];
const dice_elements = document.getElementsByClassName("die"); //node list of html elements
const dice_faces = ["one", "two", "three", "four", "five", "six"];
const dice_faces2 = ["one", "two", "three", "four", "five", "sixe"];//To modularize the validation of upper categories, I went from the src of the dice_elements to an actual number by taking of the 's'. However, sixes' has 'es' at the end, so I included this array 'sixe'.
const rollCounter = document.getElementById('rolls-remaining-content');
let isYahtzeeBonus = false;


//--------------------------Add Event Listeners-----------------------//
document.getElementById("save-game-button").addEventListener('click', saveGame);
document.getElementById("load-game-button").addEventListener('click', loadGame);
document.getElementById("new-game-button").addEventListener('click', newGame);
document.getElementById("roll-dice-button").addEventListener('click', rollTheDice);
for (let die of dice_elements) {
  die.addEventListener("dblclick", reserveDie);
}


//Add an 'enter' event listener for each input element to signal when a turn is over
for (let id of all_category_ids) {
  document.getElementById(id + '-score-value').addEventListener('keypress', disableCategory);
}





//-------------------Helper Function Definitions-----------------//


/**
 * Sets die to what the user wants them to be.
 *
 */
function setDice(d1, d2, d3, d4, d5) {
  if (rollCounter.innerHTML <= 0) {
    provideFeedback('You cannot roll the dice more than three times!', 'bad');
  }
  else if (d1 > 6 || d1 < 0 || d2 > 6 || d2 < 0 || d3 > 6 || d3 < 0 || d4 > 6 || d4 < 0 || d5 > 6 || d5 < 0) {
    provideFeedback('The face of each die must be between 0 and 6, inclusive.', 'bad');
  }
  else {
    document.getElementById('die-0').setAttribute('src', 'images/' + dice_faces[d1-1] + '.svg');
    document.getElementById('die-1').setAttribute('src', 'images/' + dice_faces[d2-1] + '.svg');
    document.getElementById('die-2').setAttribute('src', 'images/' + dice_faces[d3-1] + '.svg');
    document.getElementById('die-3').setAttribute('src', 'images/' + dice_faces[d4-1] + '.svg');
    document.getElementById('die-4').setAttribute('src', 'images/' + dice_faces[d5-1] + '.svg');
    suggest();
    bestSuggestion();
    rollCounter.innerHTML = rollCounter.innerHTML - 1;
  }
}//setDice



/**
 * Checks if the dice have been rolled.
 *
 */
function areDiceRolled() {
  for (let die of dice_elements) {
    if (die.getAttribute('src') === 'images/blank.svg' || die.getAttribute('src').substring(0,15) === 'images/spinning') {
      return false;
    }
  }
  return true;
}


/**
 * Disables input for a completed category.
 * Changes the style of the category to indicate that the category is taken
 *
 */
function disableCategory() {
  if (event.keyCode === 13  && areDiceRolled() === true) {//if the key that was pressed was 'enter'
    let el = event.target;
    let id = event.target.id;
    let score = event.target.value;
    if (scoreValidation(id, score) == true) {//score was valid
      el.disabled = true;      for (let cat of all_category_ids) {
              if (document.getElementById(cat + '-score-value').disabled === false) {
                document.getElementById(cat + '-score-value').value = '';
              }
            }
      provideFeedback('Score was valid!', 'good');
      updatesTotals();
      resetDice();
      highScore();
      if (document.getElementById('yahtzee-score-value').disabled) {
        isYahtzeeBonus = true;
      }
      if (isGameOver()) {
        let finalScore = document.getElementById('grand-total').innerHTML;
        finalScore *= 1;
        if (finalScore >= 254.59) {
          provideFeedback(`Congratulations on finishing the game with a grand total of ${document.getElementById('grand-total').innerHTML} points! Amazing job!`, 'good');
        }
        else if (150 <= finalScore && finalScore < 254.59) {
          provideFeedback(`You completed the game with a grand total of ${document.getElementById('grand-total').innerHTML} points. Not bad!`, 'good');
        }
        else {
          provideFeedback(`You ended the game with a grand total of ${document.getElementById('grand-total').innerHTML} points. Better luck next time!`, 'bad');
        }
      }//gameIsOver
    }//score was valid
    else {//score was not valid
      provideFeedback('Score was not valid!', 'bad');
    }
  }//enter if statement
}//function disableCategory



/**
 * Calculates all total scores by adding up all cateogries
 *
 */
function updatesTotals() {
  let grandSum = 0;
  let upperSumNoBonus = 0;
  let upperSum = 0;
  let lowerSum = 0;

  for (let cat of category_ids.upper) {
    let str = cat + '-score-value';
    let value = document.getElementById(str).value;
    value *= 1;
    upperSumNoBonus += value;
    upperSum += value;
    grandSum += value;
  }

  for (let cat of category_ids.lower) {
    let str = cat + '-score-value';
    let value = document.getElementById(str).value;
    value *= 1;
    grandSum += value;
    lowerSum += value;
  }

  if (upperSumNoBonus > 63) {
    upperSum += 35;
    grandSum += 35;
    document.getElementById("upper-scorecard-bonus-score").innerHTML = 35;
  }

  //only allow yahtzee bonus if they got 50 in yahtzee
  if (isYahtzeeBonus === true && document.getElementById('yahtzee-score-value').disabled === true && document.getElementById('yahtzee-score-value').value === '50' && JSON.stringify(diceContent(diceToArray()).sort()) === JSON.stringify([0,0,0,0,0,5])) {
    let x = document.getElementById('yahtzee-bonus-score-value').innerHTML;
    x *= 1;
    x += 100;
    document.getElementById('yahtzee-bonus-score-value').innerHTML = x;
  }

  let yahtzeeBonusScore = document.getElementById('yahtzee-bonus-score-value').innerHTML;
  yahtzeeBonusScore *= 1;
  document.getElementById("upper-scorecard-score").innerHTML = upperSumNoBonus;
  document.getElementById("upper-scorecard-total-score").innerHTML = upperSum;
  document.getElementById("lower-scorecard-total-score").innerHTML = (lowerSum + yahtzeeBonusScore);
  document.getElementById("bottom-upper-score-total").innerHTML = upperSum;
  document.getElementById("grand-total").innerHTML = (grandSum + yahtzeeBonusScore);
}//updatesTotals



/**
 * Resets all dice pictures to blank
 *
 */
function resetDice() {
  for (let die of dice_elements) {//reset dice to blank
    die.setAttribute('src', 'images/blank.svg'); //sets image of die to blank
    if (die.classList.contains("reserved")) {//set dice to unreserved
      die.classList.remove("reserved");
      die.classList.add("unreserved");
    }
  }//for loop
  rollCounter.innerText = 3;//reset roll counter

  //reset suggestions to blank
  for (let category of all_category_ids) {
    if (document.getElementById(category + '-score-value').disabled === false) {
      document.getElementById(category + '-suggestion').innerHTML = '';
    }
    else {//if the category is disabled, show "--" to indicate that that cell will no longer have valuable information
      document.getElementById(category + '-suggestion').innerHTML = '--';
    }
    document.getElementById(category + '-suggestion').classList.remove('best-suggestion');//remove best-suggestion class from all categories so that the next best-suggestion may be correctly calculated next move
  }
}//resetDice



/**
 * Converts dice pictures to numerical values
 *
 * @return {Array} An array of five numerical values correspinding
 *                 to the dice face, -1 for blank dice
 */
function diceToArray() {
  let dice_values = [];
  for (let die of dice_elements) {
    let str = die.getAttribute('src');
    str = str.substring(7, str.length-4);//starts at 7 to get rid of 'images/' and ends at length-4 to get rid of '.svg'
    let num = dice_faces.indexOf(str)+1;//converts number in words to the actual number via the array dice_faces
    dice_values.push(num);
  }
  return dice_values;
}//diceToArray




/**
 * Converts dice pictures to numerical values
 *
 * @return {Array} An array of six numerical values in which the i-th element
 *                 denotes how many dice rolled i+1.
 */
function diceContent(dice) {
  let content = [0,0,0,0,0,0];
  for (let i = 0; i < dice.length; i++) {
    let num = dice[i];
    content[num-1]++;
  }
  return content;
}



/**
 * Determines whether a score is valid for a particular category
 *
 * @param {String} id The id of the category
 * @param {Number} score A potential score to validate for the category
 * @return {Boolean} true for a valid score, false for an invalid score
 */
function scoreValidation (id, score) {
  let dice = diceToArray();
  let category = id.substring(0,id.length-12);//chops off 'score-value'
  if (category_ids.upper.includes(category)) {//trying to validate score from upper
    let number = dice_faces2.indexOf(category.substring(0, category.length-1))+1;
    let a = dice.filter(function(currentValue) {//filter out all non-number die faces
      return currentValue === number;
    });
    if (a.length == 0) {
      return 0 == score;
    }
    let correctScore = a.reduce(function(total, currentValue) {
      return total + currentValue;
    });
    return correctScore == score;
  }//validation of upper categories

  if (category.substring(2,category.length) === 'of-a-kind') {//
    let number = 1*category[0];//first character of id determines whether it's 3 or 4
    let content = diceContent(dice);
    if (content.includes(number) || content.includes(number+1) || content.includes(number+2)) {//checks if there are actually are 3 or 4 of a kind
      //now that we know we actually have a 3/4 of a kind, we compute the score
      //and then check if that matches with the user's input
      let correctScore = dice.reduce(function(total, currentValue) {
        return total + currentValue;
      });
      return correctScore == score;
    }
    else {//there are not 3 or 4 of a kind
      return score == 0;
    }//there are not 3 or 4 of a kind
  }//validation of 3/4-of-a-kind

  if (category === 'full-house') {
    let content = diceContent(dice).sort();
    if (content[5] === 3 && content[4] === 2) {//there is 3 of x and 2 of y, where x != y
      let correctScore = 25;
      return correctScore == score;
    }
    else {//not actually full house
      return score == 0;
    }//not actually full house
  }//validation of full house

  if (category === 'small-straight') {
    let status = false;
    let possibleSmallStraights = [
      [1,1,2,3,4],
      [1,2,2,3,4],
      [1,2,3,3,4],
      [1,2,3,4,4],
      [1,2,3,4,5],
      [1,2,3,4,6],
      [2,2,3,4,5],
      [2,3,3,4,5],
      [2,3,4,4,5],
      [2,3,4,5,5],
      [1,3,4,5,6],
      [2,3,4,5,6],
      [3,3,4,5,6],
      [3,4,4,5,6],
      [3,4,5,5,6],
      [3,4,5,6,6]
    ];
    for (let roll of possibleSmallStraights) {
      if (JSON.stringify(dice.sort()) === JSON.stringify(roll)) {
        status = true;
      }
    }
    if (status === true) {
      let correctScore = 30;
      return correctScore == score;
    }
    else {
      return score == 0;
    }
  }//validation of small-straight

  if (category === 'large-straight') {
    let status = false;
    let possibleLargeStraights = [[1,2,3,4,5],[2,3,4,5,6]];
    for (let array of possibleLargeStraights) {
      if (JSON.stringify(dice.sort()) === JSON.stringify(array)) {
        status = true;
      }
    }
    if (status === true) {
      let correctScore = 40;
      return correctScore == score;
    }
    else {
      return score == 0;
    }
  }//validation of large-straight

  if (category === 'yahtzee') {
    let content = diceContent(dice);
    if (JSON.stringify(content.sort()) === JSON.stringify([0,0,0,0,0,5])) {
      //numYahtzees++;
      //if (numYahtzees === 1) {
        let correctScore = 50;
        return correctScore == score;
      //}
      //else {
        //let yScore = document.getElementById('yahtzee-score-value').value;
        //yScore *= 1;
        //yScore += 100;
        //document.getElementById('yahtzee-score-value').value = yScore;
      //}
    }
    else {
      return score == 0;
    }
  }//validation of yahtzee

  if (category === 'chance') {
    let correctScore = dice.reduce(function(total, currentValue) {
      return total + currentValue;
    });
    return correctScore == score;
  }//validation of chance

  return false;
}//function scoreValidation





/**
 * Updates #user-feedback with an appropriate message and style.
 * If both msg and type are blank, #user-feedback becomes hidden
 *
 * @param {String} msg The message to display for the user
 * @param {String} type A context (ie. "good"/"bad") for the feedback
 */
function provideFeedback(msg, type) {
  let el = document.getElementById("user-feedback");
  el.classList.remove(...el.classList);//remove all previous classes
  el.classList.add(type);
  el.innerHTML = msg;
}


/**
 * Used to animate dice roll. Displays spinning images instead of regular.
 *
 */
function animateDice() {
  if (rollCounter.innerText > 0) {
    for (let die of dice_elements) {
      if (die.classList.contains("unreserved")) {//if the die is unreserved, then roll.
        let num = Math.ceil(6*Math.random());
        let imageName = "images/spinning_" + dice_faces[num-1] + ".svg";
        die.setAttribute('src', imageName);
      }
    }
  }
}//animateDice


/**
 * Used to animate dice roll. Displays regular images.
 *
 */
function staticDice () {
  if (rollCounter.innerText > 0) {
    for (let die of dice_elements) {
      if (die.classList.contains("unreserved")) {//if the die is unreserved, then roll.
        let num = Math.ceil(6*Math.random());
        let imageName = "images/" + dice_faces[num-1] + ".svg";
        die.setAttribute('src', imageName);
      }
    }
    rollCounter.innerText = rollCounter.innerText - 1;
  }
}



/**
 * Performs all necessary actions to roll and update display of dice
 *
 */
function rollTheDice() {
  if (rollCounter.innerText > 0) {

    //remove feedback
    let el = document.getElementById("user-feedback");
    el.classList.remove(...el.classList);
    el.classList.add('hidden');

    animateDice();
    setTimeout(animateDice, 200);
    setTimeout(animateDice, 400);
    setTimeout(animateDice, 600);
    setTimeout(animateDice, 800);
    setTimeout(staticDice, 1000);
    setTimeout(suggest, 1050);
    setTimeout(bestSuggestion, 1100);
  }
  else {
    provideFeedback('You cannot roll more than three times!', 'bad');
  }
}//rollTheDice





/**
 * Performs all necessary actions to save the current state of the game
 * in localStorage
 *
 */
function saveGame() {
  let gameName = document.getElementById('game-name-value').value;
  if (gameName === '') {//error: user has not named the game
    provideFeedback('Please name your game before saving.', 'bad');
  }
  else if (localStorage.getItem(gameName) !== null) {//error: user's game name has already been used
    provideFeedback(`The name "${gameName}" has already been used.`, 'bad');
  }
  else if (isGameOver() === true) {//error: user tries to save finished game, which is not allowed
    provideFeedback('You can only save unfinished games.', 'bad');
  }
  else {//user is good to go for saving their game
    let object = {};
    for (let cat of all_category_ids) {
      object[cat] = document.getElementById(cat + '-score-value').value;
    }
    object['rolls-remaining-content'] = document.getElementById('rolls-remaining-content').innerHTML; //save number of rolls remaining
    for (let die of dice_elements) {//save what faces the dice were and if they're reserved or not
      object[die.id + '-src'] = die.getAttribute('src');
      if (die.classList.contains('reserved')) {
        object[die.id + '-isReserved'] = 'reserved';
      }
      else {
        object[die.id + '-isReserved'] = 'unreserved';
      }
    }
    object['isYahtzeeBonus'] = isYahtzeeBonus;
    localStorage.setItem(document.getElementById('game-name-value').value, JSON.stringify(object));
    provideFeedback(`You have successfuly saved a game called "${document.getElementById('game-name-value').value}"!`, 'good');
  }
}//saveGame






/**
 * Performs all necessary actions to load the indicated game
 * from localStorage
 *
 */
function loadGame() {
  let gameName = document.getElementById('game-name-value').value;
  if (gameName === '') {
    provideFeedback('Please enter the name of the game you wish to load.', 'bad');
  }
  else {
    let game = JSON.parse(localStorage.getItem(gameName));
    if (game === null) {
      provideFeedback(`There is no saved game called "${gameName}".`, 'bad');
    }
    else {
      newGame();
      for (category in game) {
        let score = game[category];
        if (all_category_ids.includes(category)) {//loop through each key-value pair in the game object
          if (score !== '') {//if there is actually a score
            document.getElementById(category + '-score-value').value = score;
            document.getElementById(category + '-score-value').disabled = true;
          }
        }
        if (category === 'rolls-remaining-content') {
          document.getElementById('rolls-remaining-content').innerHTML = game[category];
        }
        if (category.substring(0,3) === 'die' && category.substring(6, category.length) === 'isReserved') {//dice reserved/unreserved
          let die = document.getElementById(category.substring(0,5));
          if (die.classList.contains('reserved')) {
            die.classList.remove('reserved');
          }
          if (die.classList.contains('unreserved')) {
            die.classList.remove('unreserved');
          }
          die.classList.add(game[category]);
        }//dice reserved/unreserved
        if (category.substring(0,3) === 'die' && category.substring(6, category.length) === 'src') {//dice roll
          let die = document.getElementById(category.substring(0,5));
          die.setAttribute('src', game[category]);
        }//dice roll
        isYahtzeeBonus = game['isYahtzeeBonus'];
      }//loop through each key-value pair in the game object

      updatesTotals();
      if (areDiceRolled()) {//only suggest scores if the dice have been rolled
        suggest();
        bestSuggestion();
      }
      provideFeedback(`You have successfuly loaded a game called "${gameName}"!`, 'good');
    }//else
  }//outer else

}//loadGame





/**
 * Restarts the game
 *
 */
function newGame() {
  for (let id of all_category_ids) {
    document.getElementById(id + '-score-value').removeAttribute('disabled');
    document.getElementById(id + '-score-value').value = '';
    document.getElementById(id + '-suggestion').classList.remove('best-suggestion');
  }
  resetDice();
  document.getElementById("upper-scorecard-bonus-score").innerHTML = '';
  document.getElementById("upper-scorecard-score").innerHTML = '';
  document.getElementById("yahtzee-bonus-score-value").innerHTML = '';
  document.getElementById("upper-scorecard-total-score").innerHTML = '';
  document.getElementById("lower-scorecard-total-score").innerHTML = '';
  document.getElementById("bottom-upper-score-total").innerHTML = '';
  document.getElementById("grand-total").innerHTML = '';
  document.getElementById("game-name-value").value = '';
  isYahtzeeBonus = false;
  provideFeedback("A new game has started!", "good");
}//newGame





/**
 * Toggles class from reserved to unreserved
 *
 */
function reserveDie () {
  let el = event.target;
  if (el.getAttribute('src') !== 'images/blank.svg' && el.getAttribute('src').substring(0,15) !== 'images/spinning') {//don't allow reserving of unrolled/spinning dice
    if (el.classList.contains("unreserved")) {
      el.classList.remove("unreserved");
      el.classList.add("reserved");
    }
    else {
      el.classList.remove("reserved");
      el.classList.add("unreserved");
    }
  }
}//reserveDie


/**
 * Computes and updates the user's high score, utilizing Local Storage.
 *
 */
function highScore() {
  let score = document.getElementById("grand-total").innerHTML;
  score *= 1;
  if (localStorage.getItem("highscore") === null) {//if a highscore has not yet been saved, save it for the first time
    localStorage.setItem("highscore", score);
    document.getElementById('highscore-content').innerHTML = localStorage.getItem("highscore");
  }
  else {//scores have previously been saved, so we check if the new score is greater than the previous high score
    let currentHighscore = localStorage.getItem("highscore");
    currentHighscore *= 1;
    if (score > currentHighscore) {
      localStorage.setItem("highscore", score);
      provideFeedback(`Congratulations! You've just achieved a new high score of ${score}!`, 'good')
    }
    document.getElementById('highscore-content').innerHTML = localStorage.getItem("highscore");
  }
}//highScore





/**
 * Checks whether or not game is over by seeing if every input field is disabled
 *
 */
function isGameOver() {
  for (let cat of all_category_ids) {
    let x = document.getElementById(cat + '-score-value').disabled;
    if (x === false) {//category is not disabled
      return false;
    }
  }
  return true;
}//isGameOver




/**
 * Suggests possible scores for each unfilled category.
 *
 */
function suggest() {
  let dice = diceToArray();
  for (let i = 0; i < category_ids.upper.length; i++) {
    let id = category_ids.upper[i] + '-suggestion';
    if (document.getElementById(category_ids.upper[i] + '-score-value').disabled === false) {
      let filteredDice = dice.filter(function(currentValue) {
        return currentValue === i+1;
      });
      let correctScore;
      if (filteredDice.length === 0) {
        correctScore = 0;
      }
      else {
        correctScore = filteredDice.reduce(function(total, currentValue, index) {
          return total + currentValue;
        });
      }
      document.getElementById(id).innerHTML = correctScore;
    }
    else {
      document.getElementById(id).innerHTML = '--';
    }
  }//upper

  for (let cat of category_ids.lower) {
    let id = cat + '-suggestion';
    if (cat.substring(2,cat.length) === 'of-a-kind') {
      let number = 1*cat[0];
      let content = diceContent(dice);
      if (content.includes(number) || content.includes(number+1) || content.includes(number+2)) {//checks if there are actually are 3 or 4 of a kind
        //now that we know we actually have a 3/4 of a kind, we compute the score
        //and then check if that matches with the user's input
        let correctScore = dice.reduce(function(total, currentValue) {
          return total + currentValue;
        });
        if (document.getElementById(cat + '-score-value').disabled === false) {
          document.getElementById(id).innerHTML = correctScore;
        }
        else {
          document.getElementById(id).innerHTML = '--';
        }
      }
      else {//there are not 3 or 4 of a kind
        if (document.getElementById(cat + '-score-value').disabled === false) {
          document.getElementById(id).innerHTML = 0;
        }
        else {
          document.getElementById(id).innerHTML = '--';
        }
      }//there are not 3 or 4 of a kind
    }
    if (cat === 'full-house') {
      let content = diceContent(dice).sort();
      if (content[5] === 3 && content[4] === 2) {//there is 3 of x and 2 of y, where x != y
        let correctScore = 25;
        if (document.getElementById(cat + '-score-value').disabled === false) {
          document.getElementById(id).innerHTML = correctScore;
        }
        else {
          document.getElementById(id).innerHTML = '--';
        }
      }
      else {//not actually full house
        if (document.getElementById(cat + '-score-value').disabled === false) {
          document.getElementById(id).innerHTML = 0;
        }
        else {
          document.getElementById(id).innerHTML = '--';
        }
      }//not actually full house
    }//full-house
    if (cat === 'small-straight') {
      let status = false;
      let possibleSmallStraights = [
        [1,1,2,3,4],
        [1,2,2,3,4],
        [1,2,3,3,4],
        [1,2,3,4,4],
        [1,2,3,4,5],
        [1,2,3,4,6],
        [2,2,3,4,5],
        [2,3,3,4,5],
        [2,3,4,4,5],
        [2,3,4,5,5],
        [1,3,4,5,6],
        [2,3,4,5,6],
        [3,3,4,5,6],
        [3,4,4,5,6],
        [3,4,5,5,6],
        [3,4,5,6,6]
      ];
      for (let roll of possibleSmallStraights) {
        if (JSON.stringify(dice.sort()) === JSON.stringify(roll)) {
          status = true;
        }
      }
      if (status === true) {
        let correctScore = 30;
        if (document.getElementById(cat + '-score-value').disabled === false) {
          document.getElementById(id).innerHTML = correctScore;
        }
        else {
          document.getElementById(id).innerHTML = '--';
        }
      }
      else {
        if (document.getElementById(cat + '-score-value').disabled === false) {
          document.getElementById(id).innerHTML = 0;
        }
        else {
          document.getElementById(id).innerHTML = '--';
        }
      }
    }//small-straight
    if (cat === 'large-straight') {
      let status = false;
      let possibleLargeStraights = [[1,2,3,4,5],[2,3,4,5,6]];
      for (let array of possibleLargeStraights) {
        if (JSON.stringify(dice.sort()) === JSON.stringify(array)) {
          status = true;
        }
      }
      if (status === true) {
        let correctScore = 40;
        if (document.getElementById(cat + '-score-value').disabled === false) {
          document.getElementById(id).innerHTML = correctScore;
        }
        else {
          document.getElementById(id).innerHTML = '--';
        }
      }
      else {
        if (document.getElementById(cat + '-score-value').disabled === false) {
          document.getElementById(id).innerHTML = 0;
        }
        else {
          document.getElementById(id).innerHTML = '--';
        }
      }
    }//large-straight
    if (cat === 'yahtzee') {
      let content = diceContent(dice);
      if (JSON.stringify(content.sort()) === JSON.stringify([0,0,0,0,0,5])) {
        let correctScore = 50;
        if (document.getElementById(cat + '-score-value').disabled === false) {
          document.getElementById(id).innerHTML = correctScore;
        }
        else {
          document.getElementById(id).innerHTML = '--';
        }
      }
      else {
        if (document.getElementById(cat + '-score-value').disabled === false) {
          document.getElementById(id).innerHTML = 0;
        }
        else {
          document.getElementById(id).innerHTML = '--';
        }
      }
    }
    if (cat === 'chance') {
      let correctScore = dice.reduce(function(total, currentValue) {
        return total + currentValue;
      });
      if (document.getElementById(cat + '-score-value').disabled === false) {
        document.getElementById(id).innerHTML = correctScore;
      }
      else {
        document.getElementById(id).innerHTML = '--';
      }
    }
  }//lower

}//suggest


/**
 * Highlights the best suggestion(s) green.
 *
 */
function bestSuggestion() {
  let maxScoreSuggestion = 0;
  for (let category of all_category_ids) {
    let el = document.getElementById(category + '-suggestion').classList.remove('best-suggestion');
  }
  for (let category of all_category_ids) {
    let value = document.getElementById(category + '-suggestion').innerHTML;
    value *= 1;
    if (value > maxScoreSuggestion) {
      maxScoreSuggestion = value;
    }
  }
  for (let category of all_category_ids) {
    let el = document.getElementById(category + '-suggestion');
    if (el.innerHTML == maxScoreSuggestion) {
      el.classList.add('best-suggestion');
    }
  }
}//bestSuggestion
