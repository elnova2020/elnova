'use strict'

const MINE = '💣';
const EMPTY = ' ';
const FLAG = '🚩';

const WIN_SMILEY = '😎';
const SAD_SMILEY = '🤯';
const OPTIMIC_SMILEY = '😃';

const MAX_LIVES_NUMBER = 3;
const MAX_HINTS_NUMBER = 3;
const MAX_SAFE_CLICKS_NUMBER = 3;

var gTimerInterval;

var gBoard;

var gGame;
var gLevel;

var gMinesCoords;

gLevel = { SIZE: 4, MINES: 2, MAX_LIVES_NUMBER: 1 }

var gLastCellClickedCoord;

var gUndoSteps;


function initGame() {

    console.log('init game...')

    gUndoSteps = [];

    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0,
        manualMode: false,
        manualMinesCounter: 0,
        livesCounter: gLevel.MAX_LIVES_NUMBER,
        hintsCounter: MAX_HINTS_NUMBER,
        safeClicksCounter: MAX_SAFE_CLICKS_NUMBER
    };

    chooseLevel();
    console.log('Level mines number ', gLevel.MINES);

    resetWinLooseMessage();
    var elRestartBtn = document.querySelector('.restart-btn');
    elRestartBtn.innerText = OPTIMIC_SMILEY;
    updateLivesCounterText();
    renderHintsButtons();
    document.querySelector(".best-score").style.display = 'block';
    var bestScore = retrieveLevelBestScore();

    if (bestScore !== null) {
        document.querySelector(".best-score span").innerText = retrieveLevelBestScore() + ' sec';
    } else {
        document.querySelector(".best-score span").innerText = 'Good luck !!! 🍀';
    }

    gLastCellClickedCoord = null;
    gMinesCoords = [];
    gBoard = buildBoard();
    renderBoard(gBoard);

    gGame.isOn = true;
    gGame.secsPassed = 0;
    gGame.manualMinesCounter = 0;

    if (gTimerInterval)
        clearInterval(gTimerInterval);

    document.querySelector('.timer').innerText = '00:00';
    // setTimer();

    var elSetMinesBtn = document.querySelector('.set-mines-btn');
    elSetMinesBtn.innerText = 'Set mines manually...';

}

function renderHintsButtons() {

    var elHintsBar = document.querySelector('.hints-bar');
    elHintsBar.innerText = '';

    for (var i = 0; i < gGame.hintsCounter; i++) {
        elHintsBar.innerHTML += '<button class="hint"  onclick="hintClicked(this)">🔅</button>';
    }

}

function setTimer() {
    gTimerInterval = setInterval(function () {

        gGame.secsPassed++;

        var elTimer = document.querySelector('.timer');
        var seconds = gGame.secsPassed % 60;
        var minutes = Math.floor(gGame.secsPassed / 60);

        var timeText = (minutes < 10) ? '0' + minutes : minutes;
        timeText += ':';
        timeText += (seconds < 10) ? '0' + seconds : seconds;
        elTimer.innerText = timeText;

    }, 1000);
}

function resetWinLooseMessage() {
    var elInfoMessage = document.querySelector('.info-bar h3');
    var bestPlayerName = retrieveLevelWinnerName();
    console.log('Best player is...' + bestPlayerName);

    if (bestPlayerName !== null && bestPlayerName !== 'null' && bestPlayerName !== 'undefined') {
        elInfoMessage.innerText = 'The best player : ' + bestPlayerName + ' 🍀';
    } else {
        elInfoMessage.innerText = 'Welcome && Goooood Luck !!! 🍀';
    }
}

function updateLivesCounterText() {
    var elLivesCounterText = document.querySelector('.lives-counter');
    elLivesCounterText.innerText = createLifesCounterText(gGame.livesCounter);
}

function generateRandomPlacesForMines(userClickCoord) {

    fillNumbers(gLevel.SIZE ** 2);

    for (var i = 0; i < gLevel.MINES; i++) {

        var random = getRandomNumber(gNumbersForRandomPlace);
        var coord = { i: Math.floor(random / gLevel.SIZE), j: random % gLevel.SIZE };
        if (userClickCoord && coord.i === userClickCoord.i && coord.j === userClickCoord.j) {
            random = getRandomNumber(gNumbersForRandomPlace);
            coord = { i: Math.floor(random / gLevel.SIZE), j: random % gLevel.SIZE };
        }

        gMinesCoords.push(coord);
    }

    console.log(gMinesCoords);

}

function getRandomSafePlace(board) {

    fillNumbers(gLevel.SIZE ** 2);

    var random = getRandomNumber(gNumbersForRandomPlace);
    var coord = { i: Math.floor(random / gLevel.SIZE), j: random % gLevel.SIZE };

    while (gNumbersForRandomPlace.length && (board[coord.i][coord.j].isMine || board[coord.i][coord.j].isShown)) {
        random = getRandomNumber(gNumbersForRandomPlace);
        coord = { i: Math.floor(random / gLevel.SIZE), j: random % gLevel.SIZE };
    }

    return coord;
}

function safeClicked(elBtn) {
    gGame.safeClicksCounter--;

    if (gGame.safeClicksCounter < 0) {

        elBtn.innerText = 'no more safe clicks';
        return;
    }

    var coord = getRandomSafePlace(gBoard);
    gBoard[coord.i][coord.j].isHint = true;
    renderCell(coord.i, coord.j, gBoard[coord.i][coord.j]);

    setTimeout(function () {
        gBoard[coord.i][coord.j].isHint = false;
        renderCell(coord.i, coord.j, gBoard[coord.i][coord.j]);
    }, 2000);
}

function buildBoard() {

    var board = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([]);
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            };

            board[i][j] = cell;
        }
    }

    return board;

}

function setBoardData(board) {

    for (var k = 0; k < gMinesCoords.length; k++) {
        var i = gMinesCoords[k].i;
        var j = gMinesCoords[k].j;
        console.log('setBoardData: Mine coord: i ' + i + ', j ' + j + '}');
        board[i][j].isMine = true;
    }

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {

            if (!board[i][j].isMine) {
                setMinesNegsCount(board, { i: i, j: j });
            }
        }
    }
}

function renderBoard(board, showMines = false) {

    var strHTML = '<table border="1"  cellpadding="10" oncontextmenu="return false;"><tbody>';

    for (var i = 0; i < gLevel.SIZE; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < gLevel.SIZE; j++) {

            var cellContent = (board[i][j].isMine) ? MINE : (board[i][j].minesAroundCount === 0) ? EMPTY : board[i][j].minesAroundCount;

            var cell = (showMines) ? cellContent : ' ';

            var className = `cell${i}-${j}`;

            strHTML += `<td class="cell ${className}" onmouseup="cellMarked(event, ${i}, ${j})" onclick="cellClicked(${i}, ${j})">${cell}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';

    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;

}

function setMinesNegsCount(board, coord) {

    for (var i = coord.i - 1; i <= coord.i + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = coord.j - 1; j <= coord.j + 1; j++) {
            if (i === coord.i && j === coord.j) continue;
            if (j < 0 || j >= board[i].length) continue;

            if (board[i][j].isMine)
                board[coord.i][coord.j].minesAroundCount++;
        }
    }

}

function cellClicked(i, j) {
    if (!gGame.isOn) return;

    if (gGame.manualMode) {

        if (gBoard[i][j].isMine) { // unselect
            gBoard[i][j].isMine = false;
            gGame.manualMinesCounter--;
            for (var k = 0; k < gMinesCoords.length; k++) {
                if (i === gMinesCoords[k].i && j === gMinesCoords[k].j) {
                    gMinesCoords.splice(k, 1);
                }
            }

            renderBoard(gBoard, true);

        } else {

            if (gGame.manualMinesCounter === gLevel.MINES) return;
            gBoard[i][j].isMine = true;
            gGame.manualMinesCounter++;
            gMinesCoords.push({ i: i, j: j });
            renderBoard(gBoard, true);
        }

        if (gGame.manualMinesCounter === gLevel.MINES) {

            var elSetMinesBtn = document.querySelector('.set-mines-btn');
            elSetMinesBtn.innerText = 'SAVE && GO...';
        
            // previous code
            // setTimeout( function(){
            //     setBoardData(gBoard);
            //     renderBoard();
            // gGame.manualMode = false;
            // var elSetMinesBtn = document.querySelector('.set-mines-btn');
            // elSetMinesBtn.innerText = 'SAVE && GO...';
            //     setTimer(); 

            // }, 2000);
        }

        return;
    }

    console.log('clicked on { i : ' + i + ', j : ' + j + '}');

    if (gBoard[i][j].isMarked) return;

    //first click
    if (gMinesCoords.length === 0) {
        var userClickCoord = { i: i, j: j };
        generateRandomPlacesForMines(userClickCoord);
        setBoardData(gBoard);
        renderBoard(gBoard);

        gUndoSteps.push(makeGameSnapshot(gGame, gBoard));

        console.log('SNAPSHOT ADDED...FOR THE FIRST TIME')

        setTimer();
    }

    gBoard[i][j].isShown = true;
    gGame.shownCount++;

    //if there is a mine on cell game is over
    if (gBoard[i][j].isMine && !gGame.manualMode) {

        gGame.livesCounter--;

        updateLivesCounterText();

        if (gGame.livesCounter === 0 || gGame.isShown == gLevel.SIZE ** 2) {
            renderBoard(gBoard, true);
            renderCell(i, j, gBoard[i][j]);
            gameOver(false);

            return;
        }
    }

    renderCell(i, j, gBoard[i][j]);

    console.log('click... shownCount ', gGame.shownCount);
    //click on empty
    //show number or empty field with neighbours
    if (gBoard[i][j].minesAroundCount === 0) {

        renderNeighboursCells(gBoard, { i, j });

    }

    gLastCellClickedCoord = { i: i, j: j };

    var snap = makeGameSnapshot(gGame, gBoard);
    gUndoSteps.push(snap);
    console.log('SNAPSHOT ADDED...');
    console.log('PRINT ADDED SNAPHOT');
    printShownsOnSnapshot(snap.boardState);

    if (checkGameOver()) gameOver();

}

function makeSnapshot(board) {

    var snapshot = [];

    for (var i = 0; i < board.length; i++) {
        snapshot[i] = [];
        for (var j = 0; j < board.length; j++) {
            var newCell = copyBoardCell(board[i][j]);
            snapshot[i][j] = newCell;
        }

    }

    return snapshot;
}

function makeGameSnapshot(game, board){

    var step = {};

    step.gameState = copyGameState(game);
    step.boardState = makeSnapshot(board);

    return step;
}

function copyBoardCell(cell) {

    var copyCell = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false
    };

    copyCell.minesAroundCount = cell.minesAroundCount;
    copyCell.isShown = cell.isShown;
    copyCell.isMarked = cell.isMarked;
    copyCell.isMine = cell.isMine;

    return copyCell;
}

function copyGameState(game){
    var copyGame = {};

    for ( var key in game ) {
        copyGame[key] = game[key];
    }

    return copyGame;
}

var gUndoClickCounter = 0;

function undoClicked() {

    if ( !gGame.isOn ) return; // no undo when game is over

    var step;
    var board;

    console.log('stack length...', gUndoSteps.length);

    if (gUndoSteps.length === 1) return;

    gUndoSteps.pop(); // pop current state

    step = gUndoSteps.pop(); // get previous step
    board = step.boardState;
    console.log('UNDO...' + gUndoClickCounter++);
    printShownsOnSnapshot(board);

    //render previous step
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {

            renderCell(i, j, board[i][j]);
        }
    }

    //render game state
    renderGameState( step.gameState );

    console.log('Previous game state ',step.gameState );

    gUndoSteps.push(step); //push back after rendering - this is a current state now

    gBoard = makeSnapshot(board);
    gGame = copyGameState(step.gameState);

}

function renderGameState( game ){

    if ( game.isOn ){
        var elRestartBtn = document.querySelector('.restart-btn');
        elRestartBtn.innerText = OPTIMIC_SMILEY;
        // var elInfoMessage = document.querySelector('.info-bar h3'); 
    }

    resetWinLooseMessage();
    updateLivesCounterText();
    renderHintsButtons();
}

function printShownsOnSnapshot(board) {

    console.log('PRINT SNAPSHOT...')
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board.length; j++) {
            if (board[i][j].isShown) {
                console.log(`Shown cell is {${i},${j}}, cell ${board[i][j]}`);
            }
        }
    }
}

function cellMarked(event, i, j) {

    if (!gGame.isOn) return;

    if (gBoard[i][j].isShown) return;

    if (event.button == 2) {

        console.log('right click on { i : ' + i + ', j : ' + j + '}');

        if (gBoard[i][j].isMarked) {
            //unselect
            gBoard[i][j].isMarked = false;
            gGame.markedCount--;
            console.log('previous value of marked cell ', gBoard[i][j]);
            renderCell(i, j, gBoard[i][j]);
        } else {

            // if (gGame.markedCount === gLevel.MINES) return;

            gBoard[i][j].isMarked = true;
            renderCell(i, j, gBoard[i][j]);
            gGame.markedCount++;
        }

        gUndoSteps.push(makeGameSnapshot(gGame, gBoard));
        console.log('cellMarked: SNAPSHOT ADDED');

        if (checkGameOver()) gameOver();

    }

}

function renderCell(i, j, cell) {
    // Select the elCell and set the value
    var elCell = document.querySelector(`.cell${i}-${j}`);

    // console.log('rendering cell..', elCell);
    // console.log('model cell ', cell);

    if (cell.isMarked) {
        elCell.innerHTML = FLAG;
        elCell.style.backgroundColor = 'grey';
    } else if (cell.isShown || cell.isHint) {
        elCell.innerHTML = (cell.minesAroundCount === 0) ? EMPTY : cell.minesAroundCount;
        elCell.style.backgroundColor = 'lightblue';
        if (cell.isMine) {
            elCell.innerHTML = MINE;
            elCell.style.backgroundColor = 'red';
        }
    } else {
        elCell.innerHTML = EMPTY;
        elCell.style.backgroundColor = 'grey';
    }

}

function renderNeighboursCells(board, coord) {

    console.log('rendering neighbours...');

    for (var i = coord.i - 1; i <= coord.i + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = coord.j - 1; j <= coord.j + 1; j++) {
            if (i === coord.i && j === coord.j) continue;
            if (j < 0 || j >= board[i].length) continue;

            if (!board[i][j].isMine && !board[i][j].isShown) {
                board[i][j].isShown = true;
                renderCell(i, j, board[i][j]);
                gGame.shownCount++;
                if (board[i][j].minesAroundCount === 0) {
                    renderNeighboursCells(board, { i: i, j: j });
                }
            }
        }
    }

    console.log('neighbours rendering ... showCount ', gGame.shownCount);
}

function getNeighboursCells(board, coord) {
    var neighbours = [];

    for (var i = coord.i - 1; i <= coord.i + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = coord.j - 1; j <= coord.j + 1; j++) {
            if (i === coord.i && j === coord.j) continue;
            if (j < 0 || j >= board[i].length) continue;

            var negCoord = { i: i, j: j };
            neighbours.push(negCoord);

        }
    }

    return neighbours;

}

function hintClicked(elHintBtn) {

    if (gLastCellClickedCoord) {
        gGame.hintsCounter--;
        handleHintsBehaviour(gLastCellClickedCoord.i, gLastCellClickedCoord.j, elHintBtn);
        elHintBtn.style.fontSize = 'x-large';
    }

}

function handleHintsBehaviour(i, j, elHintBtn) {

    console.log('Handle hints behaviour...')
    if (gGame.hintsCounter >= 0) {
        var cellCoords = getNeighboursCells(gBoard, { i: i, j: j });

        for (var k = 0; k < cellCoords.length; k++) {
            console.log(cellCoords[k]);
        }

        for (var k = 0; k < cellCoords.length; k++) {
            var cell = gBoard[cellCoords[k].i][cellCoords[k].j];
            cell.isHint = true;
            renderCell(cellCoords[k].i, cellCoords[k].j, cell);
        }

        setTimeout(function () {
            for (var k = 0; k < cellCoords.length; k++) {
                var cell = gBoard[cellCoords[k].i][cellCoords[k].j];
                cell.isHint = false;
                renderCell(cellCoords[k].i, cellCoords[k].j, cell);
                // elHintBtn.style.visibility = 'hidden';
                elHintBtn.style.display = 'none';
                elHintBtn.style.fontSize = 'large';
                if (gGame.hintsCounter === 0) {

                    var elHintsBar = document.querySelector('.hints-bar');
                    elHintsBar.innerText = 'NO MORE HINTS...';
                }
            }
        }, 1000);
    }

}

function setMinesBtnClicked() {

    //if game is running it's impossible to click on the button
    if (gGame.secsPassed > 0) return;

    if (gMinesCoords.length === gLevel.MINES) {
        setBoardData(gBoard);
        renderBoard(gBoard);
        gGame.manualMode = false;

        var elSetMinesBtn = document.querySelector('.set-mines-btn');
        elSetMinesBtn.innerText = 'GO !!!';

        setTimer();
        return;
    }

    gGame.manualMode = true;
    gMinesCoords = [];

    gBoard = buildBoard();
}

function checkGameOver() {

    console.log('gGame.shownCount ' + gGame.shownCount + ', gGame.markedCount ' + gGame.markedCount);
    return gGame.markedCount + gGame.shownCount === gLevel.SIZE ** 2;

}

function gameOver(win = true) {
    console.log('Game Over');
    gGame.isOn = false;

    if (gGame.manualMode) gGame.manualMode = false;

    clearInterval(gTimerInterval);

    // gSteps = [];

    var elRestartBtn = document.querySelector('.restart-btn');
    var elInfoMessage = document.querySelector('.info-bar h3');

    if (win) {

        elInfoMessage.innerText = 'Congratulations !!! You won !!!'
        elRestartBtn.innerText = WIN_SMILEY;
        saveBestScore();

    } else {

        elInfoMessage.innerText = 'Ooooh !... Next time you\'ll win...';
        elRestartBtn.innerText = SAD_SMILEY;
        updateLivesCounterText();
        
    }
}

function chooseLevel() {

    var levels = document.forms['form'].elements['level'];

    for (var i = 0; i < levels.length; i++) {
        levels[i].onclick = function () {
            setLevel(this.value);
            console.log('level chosen...');

        };
    }
}

function setLevel(level) {

    gLevel.SIZE = +level;

    switch (gLevel.SIZE) {
        case 4:
            gLevel.MINES = 2;
            gLevel.MAX_LIVES_NUMBER = 1;
            break;

        case 8:
            gLevel.MINES = 12;
            gLevel.MAX_LIVES_NUMBER = 3;
            break;

        case 12:
            gLevel.MINES = 30;
            gLevel.MAX_LIVES_NUMBER = 3;
            break;
    }

    initGame();

}

function saveBestScore() {

    console.log('gGame.secsPassed --- ', gGame.secsPassed);

    // Check browser support
    if (typeof (Storage) !== "undefined") {
        // Store
        var scoreInStoage = retrieveLevelBestScore();

        console.log('Best score from storage ', scoreInStoage);
        if (scoreInStoage == null || scoreInStoage === 'undefined' || scoreInStoage > gGame.secsPassed) {
            document.querySelector(".best-score span").innerText = gGame.secsPassed + ' secs.\nYour time is the best now !!!';
            storeLevelBestScore(gGame.secsPassed);

            var winnerName = prompt('CONGRATULATIONS !!! YOUR TIME IS THE BEST !!!\n Please, enter your name...');
            if (winnerName) storeLevelWinnerName(winnerName);

        } else {

            document.querySelector(".best-score span").innerText = scoreInStoage + ' sec';
        }

    } else {
        document.querySelector(".best-score").innerHTML = "Sorry, your browser does not support Web Storage...";
    }
}

function storeLevelWinnerName(name) {
    localStorage.setItem(gLevel.SIZE + "-winner-name", name);
}

function retrieveLevelWinnerName() {
    return localStorage.getItem(gLevel.SIZE + "-winner-name");
}

function storeLevelBestScore(value) {
    localStorage.setItem(gLevel.SIZE + "-best-score", value);
}

function retrieveLevelBestScore() {
    return localStorage.getItem(gLevel.SIZE + "-best-score");
}

// FOR DEBUG ONLY
function showMines() {
    for (var k = 0; k < gMinesCoords.length; k++) {
        var i = gMinesCoords[k].i;
        var j = gMinesCoords[k].j;
        renderCell(i, j, gBoard[i][j]);
    }
}

function showAllBoard() {

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            gBoard[i][j].isShown = true;
            renderCell(i, j, gBoard[i][j]);
        }
    }

}