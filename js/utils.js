'use strict'

var gNumbersForRandomPlace;

function fillNumbers(size){
    gNumbersForRandomPlace = [];
    for ( var i = 0; i < size; i++ ){
        gNumbersForRandomPlace.push(i);
    }
}

function getRandomNumber(numbers){

    var idx = Math.floor(Math.random()*numbers.length);
    var res = numbers[idx];
    numbers.splice(idx,1);

    return res;
}

function createLifesCounterText(lifesCounter) {

    var text = '';

    for (var i = 0; i < lifesCounter; i++ ) {
        text += '😺';
    }

    if (lifesCounter === 0){
        text = '🙀 No Lives...';
    }

    return text;
}
