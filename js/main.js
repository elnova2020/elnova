'use strict'

const MINE = '💣';
const EMPTY = ' ';
const FLAG = '🚩';

var gTimerInterval;

var gBoard;

var gGame;
var gLevel;

var gMinesCoord = [{ i: 0, j: 0 }];//, {i: 3, j: 1}];

var gFoundMines=0;
var gMarkedCells = {};

gLevel = { SIZE: 4, MINES: 2 };

function initGame() {

    console.log('init game...')
    gGame = {
        isOn: false,
        shownCount: 0,
        markedCount: 0,
        secsPassed: 0
    };

    chooseLevel();

    var elTimer = document.querySelector('.timer');
    elTimer.innerText = '00:00';

    gBoard = buildBoard();
    renderBoard();

    console.log(gBoard);

    gGame.isOn = true;
    gGame.secsPassed = 0;

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

    for (var k = 0; k < gMinesCoord.length; k++) {
        var i = gMinesCoord[k].i;
        var j = gMinesCoord[k].j;
        board[i][j].isMine = true;

        setMinesNegsCount(board, gMinesCoord[k]);
    }

    return board;

}

function renderBoard() {

    var strHTML = '<table border="1"  cellpadding="10" oncontextmenu="return false;"><tbody>';

    for (var i = 0; i < gLevel.SIZE; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = ' ';
            // var cell = gBoard[i][j].minesAroundCount;
            var className = `cell${i}-${j}`;
            strHTML += `<td class="cell ${className}" onmouseup="cellMarked(event, this, ${i}, ${j})" onclick="cellClicked(this, ${i}, ${j})">${cell}</td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';

    var elBoard = document.querySelector('.board');
    elBoard.innerHTML = strHTML;

}

function setMinesNegsCount(board, mineCoord) {

    for (var i = mineCoord.i - 1; i <= mineCoord.i + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = mineCoord.j - 1; j <= mineCoord.j + 1; j++) {
            if (i === mineCoord.i && j === mineCoord.j) continue;
            if (j < 0 || j >= board[i].length) continue;

            if (!board[i][j].isMine)
                board[i][j].minesAroundCount++;
        }
    }

}

function cellClicked(elCell, i, j) {

    if (!gGame.isOn) return;

    console.log('clicked on { i : ' + i + ', j : ' + j);

    if ( gBoard[i][j].isMarked ) return;

    gBoard[i][j].isShown = true;
    gGame.shownCount++;

    //if there is a mine on cell game is over
    for (var k = 0; k < gMinesCoord.length; k++) {
        if (gMinesCoord[k].i == i && gMinesCoord[k].j == j) {
            gBoard[i][j].isMine = true;
            renderCell(i, j, gBoard[i][j]);
            gameOver(false);
            return;
        }
    }

    renderCell(i, j, gBoard[i][j]);
    
    console.log( 'click... showCount ', gGame.shownCount );
    //click on empty
    //show number or empty field with neighbours
    if (gBoard[i][j].minesAroundCount === 0) {

        renderNeighboursCells(gBoard, { i, j });
    }

}

function renderNeighboursCells(board, coord) {

    var neighbours = [];

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
                
            }
        }
    }

    console.log( 'neighbours rendering ... showCount ', gGame.shownCount );

    return neighbours;
}

function cellMarked(event, cell, i, j) {

    if (!gGame.isOn) return;

    console.log('right click on { i : ' + i + ', j : ' + j + '}');

    if ( gBoard[i][j].isShown ) return;

    if (event.button == 2) {

        if (gBoard[i][j].isMarked) {
            //unselect
            gBoard[i][j].isMarked = false;
            console.log('previous value of marked cell ', gBoard[i][j]);
            renderCell(i, j, gBoard[i][j]);
        } else {

            // if (gBoard[i][j].isMine) {
            //     //found a mine
            // }

            gBoard[i][j].isMarked = true;
            renderCell(i, j, gBoard[i][j]);
            gGame.markedCount++;
        }
    }

    if ( checkGameOver() ) gameOver();

}

function renderCell(i, j, cell) {
    // Select the elCell and set the value
    var elCell = document.querySelector(`.cell${i}-${j}`);

    console.log('rendering cell..', elCell);
    console.log('model cell ', cell);

    if ( cell.isMarked ){
        elCell.innerHTML = FLAG;
    } else if ( cell.isShown ){
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

function checkGameOver(){

    console.log( 'gGame.shownCount ' + gGame.shownCount + ', gGame.markedCount ' + gGame.markedCount );
    return (gGame.markedCount + gGame.shownCount == gLevel.SIZE**2);
  
}

function gameOver(win=true) {
    console.log('Game Over');
    gGame.isOn = false;

    if (gTimerInterval)
        clearInterval(gTimerInterval);

    var elInfoMessage = document.querySelector('.info-bar h3');
    elInfoMessage.style.color = 'white';
    elInfoMessage.innerText = 'Congratulations !!! You won !!!'

    if (!win){
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

        };
    }
}

function setLevel(level) {

    gLevel.SIZE = level;

    switch (level) {
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

function setMinesOnBoard() {

    //TODO:

}