'use strict'

const MINE = '💣';
const EMPTY = ' ';
const FLAG = '🚩';

var gTimerInterval;

var gBoard;

var gGame;
var gLevel;

var gMinesCoord; //[{ i: 0, j: 0 }];//, {i: 3, j: 1}];

var gFoundMines = 0;
var gMarkedCells = {};

var gLevel;

gLevel = { SIZE: 4, MINES: 2 }

function initGame() {

    console.log('init game...')
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0
    };

    chooseLevel();

    console.log('Level mines number ', gLevel.MINES);

    gMinesCoord = [];

    var elTimer = document.querySelector('.timer');
    elTimer.innerText = '00:00';

    // generateRandomPlacesForMines(coord=null);

    gBoard = buildBoard();
    renderBoard();

    gGame.isOn = true;
    gGame.secsPassed = 0;

    setTimer();
}

function setTimer(){
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

function generateRandomPlacesForMines(userClickCoord) {

    fillNumbers(gLevel.SIZE ** 2);

    for (var i = 0; i < gLevel.MINES; i++) {

        var random = getRandomNumber(gNumbersForRandomPlace);
        var coord = { i: Math.floor(random / gLevel.SIZE), j: random % gLevel.SIZE };
        if (userClickCoord && coord.i === userClickCoord.i && coord.j === userClickCoord.j ) {
            random = getRandomNumber(gNumbersForRandomPlace);
            coord = { i: Math.floor(random / gLevel.SIZE), j: random % gLevel.SIZE };
        }

        gMinesCoord.push(coord);
    }

    console.log(gMinesCoord);

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

    // setBoardData(board)

    return board;

}

function setBoardData(board) {

    for (var k = 0; k < gMinesCoord.length; k++) {
        var i = gMinesCoord[k].i;
        var j = gMinesCoord[k].j;
        console.log(' i ' + i + ', j ' + j);
        board[i][j].isMine = true;
    }

    for ( var i = 0; i < board.length; i++ ){
        for (var j = 0; j < board.length; j ++){

            if (!board[i][j].isMine) {
                setMinesNegsCount(board, {i: i, j: j});
            }
        }
    }
}

function renderBoard() {

    var strHTML = '<table border="1"  cellpadding="10" oncontextmenu="return false;"><tbody>';

    for (var i = 0; i < gLevel.SIZE; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = ' ';
            // var cell = (gBoard[i][j].isMine) ? MINE : gBoard[i][j].minesAroundCount; //DEBUG !!! - REMOVE !!!s
            var className = `cell${i}-${j}`;
            strHTML += `<td class="cell ${className}" onmouseup="cellMarked(event, this, ${i}, ${j})" onclick="cellClicked(${i}, ${j})">${cell}</td>`
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

    console.log('clicked on { i : ' + i + ', j : ' + j);

    if (gBoard[i][j].isMarked) return;

    //first click
    if (gMinesCoord.length === 0) {
        var userClickCoord = {i: i, j: j};
        generateRandomPlacesForMines(userClickCoord);
        setBoardData(gBoard);
        renderBoard();
    }

    gBoard[i][j].isShown = true;
    gGame.shownCount++;

    //if there is a mine on cell game is over
    if (gBoard[i][j].isMine) {
        renderCell(i, j, gBoard[i][j]);
        // show all mines
        // for (var k = 0; k < gMinesCoord.length; k++) {
        //     var x = gMinesCoord[k].i;
        //     var y = gMinesCoord[k].j;
        //     if ( x!== i && y != j){
        //         renderCell(x, y, gBoard[x][y]);
        //     }
        // }

        gameOver(false);
        return;
    }

    renderCell(i, j, gBoard[i][j]);

    console.log('click... showCount ', gGame.shownCount);
    //click on empty
    //show number or empty field with neighbours
    if (gBoard[i][j].minesAroundCount === 0) {

        renderNeighboursCells(gBoard, { i, j });
    }

    if (checkGameOver()) gameOver();

}

function cellMarked(event, cell, i, j) {

    if (!gGame.isOn) return;

    console.log('right click on { i : ' + i + ', j : ' + j + '}');

    if (gBoard[i][j].isShown) return;

    if (event.button == 2) {

        if (gBoard[i][j].isMarked) {
            //unselect
            gBoard[i][j].isMarked = false;
            console.log('previous value of marked cell ', gBoard[i][j]);
            renderCell(i, j, gBoard[i][j]);
        } else {

            gBoard[i][j].isMarked = true;
            renderCell(i, j, gBoard[i][j]);
            gGame.markedCount++;
        }
    }

    if (checkGameOver()) gameOver();

}

function renderCell(i, j, cell) {
    // Select the elCell and set the value
    var elCell = document.querySelector(`.cell${i}-${j}`);

    console.log('rendering cell..', elCell);
    console.log('model cell ', cell);

    if (cell.isMarked) {
        elCell.innerHTML = FLAG;
    } else if (cell.isShown) {
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

    var neighbours = [];

    console.log('rendering neighbours...' + coord);

    for (var i = coord.i - 1; i <= coord.i + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = coord.j - 1; j <= coord.j + 1; j++) {
            if (i === coord.i && j === coord.j) continue;
            if (j < 0 || j >= board[i].length) continue;

            if (!board[i][j].isMine && !board[i][j].isShown) {
                board[i][j].isShown = true;
                renderCell(i, j, board[i][j]);
                gGame.shownCount++;
                var negCoord = {i: i, j: j};
            }
        }
    }

    console.log('neighbours rendering ... showCount ', gGame.shownCount);

    return neighbours;
}

function checkGameOver() {

    console.log('gGame.shownCount ' + gGame.shownCount + ', gGame.markedCount ' + gGame.markedCount);
    return (gGame.markedCount + gGame.shownCount == gLevel.SIZE ** 2);

}

function gameOver(win = true) {
    console.log('Game Over');
    gGame.isOn = false;

    if (gTimerInterval)
        clearInterval(gTimerInterval);

    var elInfoMessage = document.querySelector('.info-bar h3');
    elInfoMessage.style.color = 'white';
    elInfoMessage.innerText = 'Congratulations !!! You won !!!'

    if (!win) {
        elInfoMessage.innerText = 'Ooooh !... Next time you\'ll win...';
    }
}

function restart() {
    console.log('Restart...');
    gameOver();

    initGame();
}

function chooseLevel() {

    var levels = document.forms['form'].elements['level'];

    // loop through list
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
            break;

        case 8:
            gLevel.MINES = 12;

            break;

        case 12:
            gLevel.MINES = 30;
            break;
    }

    initGame();

}

// FOR DEBUG ONLY
function showMines() {
    for (var k = 0; k < gMinesCoord.length; k++) {
        var i = gMinesCoord[k].i;
        var j = gMinesCoord[k].j;
        renderCell(i, j, gBoard[i][j], true);
    }
}

function showAllBoard() {

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard.length; j++) {
            gBoard[i][j].isShown = true;
            renderCell(i, j, gBoard[i][j], true);
        }
    }

}