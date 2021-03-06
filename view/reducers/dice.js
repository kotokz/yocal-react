/**
 * Created by kotokz on 15/8/22.
 */
import Immutable from 'immutable';
import GameConstants from '../constants/gameConstants';
import createReducer from '../util/createReducer';
import R from 'ramda'

let initialState = {
    score: 0,
    scoring: {
        ones: null,
        twos: null,
        threes: null,
        fours: null,
        fives: null,
        sixes: null,
        three_of_a_kind: null,
        four_of_a_kind: null,
        full_house: null,
        small_run: null,
        large_run: null,
        reduxee: null,
        chance: null
    },
    heldDice: [],
    dice: [],
    rolls: 0,
    isNewTurn: true
}


function resetTurn() {
    return {
        heldDice: [],
        dice: [],
        rolls: 0,
        isNewTurn: true
    }
}

function scoreForNumber(state, key, num) {
    let sameNum = R.filter(n => n === num)
    let scoreFor = R.sum(sameNum(state.dice))
    return finishScoringState(state, key, scoreFor)
}

function finishScoringState(state, stat, points) {
    return {
        ...state,
        ...resetTurn(),
        scoring: {
            ...state.scoring,
            [stat]: points
        },
        score: state.score + points
    }
}

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

let countDiceByNumber = R.countBy(R.identity)

export default createReducer(initialState, {
    [GameConstants.ROLL_DICE](state, action) {
        let diceRange = R.range(0, 5)
        let getDice = R.map(i => R.contains(i, state.heldDice)
            ? state.dice[i]
            : getRandomInt(1, 6))
        let rolls = state.rolls + 1

        return {
            ...state,
            rolls,
            isNewTurn: false,
            dice: getDice(diceRange),
            heldDice: rolls > 2 ? diceRange : state.heldDice
        }
    },
    [GameConstants.HOLD_DIE](state, action){
        // copy the array, for redux shallow compare
        let newHelds = state.heldDice.slice()
        if (R.contains(action.index, newHelds)) {
            // remove held die
            newHelds = R.filter(i => i !== action.index, newHelds)
        } else {
            // add to held dice
            newHelds.push(action.index)
        }
        return {
            ...state,
            heldDice: newHelds
        }
    },
    [GameConstants.RESET_GAME](state, action) {
        return {
            ...resetTurn(),
            scoring: initialState.scoring,
            score: 0,
        }
    },
    [GameConstants.SCORE_ONES](state, action) {
        return scoreForNumber(state, 'ones', 1)
    },
    [GameConstants.SCORE_TWOS](state, action) {
        return scoreForNumber(state, 'twos', 2)
    },
    [GameConstants.SCORE_THREES](state, action) {
        return scoreForNumber(state, 'threes', 3)
    },
    [GameConstants.SCORE_FOURS](state, action) {
        return scoreForNumber(state, 'fours', 4)
    },
    [GameConstants.SCORE_FIVES](state, action) {
        return scoreForNumber(state, 'fives', 5)
    },
    [GameConstants.SCORE_SIXES](state, action) {
        return scoreForNumber(state, 'sixes', 6)
    },
    [GameConstants.SCORE_THREE_OF_A_KIND](state, action) {
        // validate for 3 of a kind
        let diceByNum3 = countDiceByNumber(state.dice)
        let threeOrMore = R.head(R.filter(k => diceByNum3[k] >= 3, Object.keys(diceByNum3)))
        if (!threeOrMore) {
            console.log('cannot score')
            return state
        }
        // score all dice
        return finishScoringState(state, 'three_of_a_kind', R.sum(state.dice))
    },
    [GameConstants.SCORE_FOUR_OF_A_KIND](state, action) {
        // validate for four of a kind
        let diceByNum4 = countDiceByNumber(state.dice)
        let fourOrMore = R.head(R.filter(k => diceByNum4[k] >= 4, Object.keys(diceByNum4)))
        if (!fourOrMore) {
            console.log('cannot score')
            return state
        }
        // score all dice
        return finishScoringState(state, 'four_of_a_kind', R.sum(state.dice))

    },
    [GameConstants.SCORE_FULL_HOUSE](state, action) {
        // validate full House
        let fhDice = R.values(countDiceByNumber(state.dice))
        if ((fhDice[0] === 2 && fhDice[1] === 3) ||
            (fhDice[0] === 3 && fhDice[1] === 2)) {
            // Full House scores 25
            return finishScoringState(state, 'full_house', 25)
        } else {
            console.log('cannot score')
            return state
        }
    },
    [GameConstants.SCORE_SMALL_RUN](state, action) {
        // validate small run
        let sortedCopy = state.dice.slice().sort((a, b) => a - b)
        let sdice = R.uniq(sortedCopy)
        let slices = R.aperture(4, sdice)
        let possibleRuns = [
            [1, 2, 3, 4],
            [2, 3, 4, 5],
            [3, 4, 5, 6]
        ]
        let isRun = R.contains(R.__, possibleRuns)
        if (R.any(isRun)(slices)) {
            // small run scores 30
            return finishScoringState(state, 'small_run', 30)
        } else {
            console.log('cannot score')
            return state
        }
    },
    [GameConstants.SCORE_LARGE_RUN](state, action) {
        // validate large run
        let sortedCopy = state.dice.slice().sort((a, b) => a - b)
        let sdice = R.uniq(sortedCopy)
        let slices = R.aperture(5, sdice)
        let possibleRuns = [
            [1, 2, 3, 4, 5],
            [2, 3, 4, 5, 6]
        ]
        let isRun = R.contains(R.__, possibleRuns)
        if (R.any(isRun)(slices)) {
            // small run scores 40
            return finishScoringState(state, 'large_run', 40)
        } else {
            console.log('cannot score')
            return state
        }
    },
    [GameConstants.SCORE_REDUXEE](state, action) {
        let aDie = state.dice[0]
        if (R.all(dice => dice === aDie, state.dice)) {
            // reduxee scores 50
            return finishScoringState(state, 'reduxee', 50)
        } else {
            console.log('cannot score')
            return state
        }
    },
    [GameConstants.SCORE_CHANCE](state, action) {
        return finishScoringState(state, 'chance', R.sum(state.dice))
    }
});