const { Card, Board } = require('../models/associationsIndex')

const getCards = async (req, res, next) => {
    try {
        const cards = await Card.findAll()
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json(cards)
    } catch (error) {
        next(error)
    }
}

const postCard = async (req, res, next) => {
    try {
        if (!req.body.boardUuid) throw new Error("Provide a boardUuid")
        const board = await Board.findOne({ where: {uuid: req.body.boardUuid}})

        const card = Card.build({
            BoardId: board.id // DB value is BoardId, js is boardId
        })
        if (req.body.content) card.content = req.body.content
        if (req.body.color) card.color = req.body.color
        if (req.body.position) card.position = req.body.position 
        if (req.body.size) card.size = req.body.size

        await card.save()
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json(card)
    } catch (error) {
        next(error)
    }
}

const getCard = async (req, res, next) => {
    try {
        const card = await Card.findOne({
            where: { 
                uuid: req.params.cardUuid
            },
            include: Board
        })
        if (card.Board.dataValues.UserId !== req.user.id) {
            throw new Error("Can't view card you don't own")
        }
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json( card )
    } catch (error) {
        next(error)
    }
}

const updateCard = async (req, res, next) => {
    try {
        const card = await Card.findOne({
            where: {
                uuid: req.params.cardUuid
            },
            include: Board
        })
        if (card.Board.dataValues.UserId !== req.user.id) {
            throw new Error("Can't modify card you don't own")
        }
        if (req.body.content) card.content = req.body.content
        if (req.body.color) card.color = req.body.color
        if (req.body.position) card.position = req.body.position 
        if (req.body.size) card.size = req.body.size
        const result = await card.save()
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json( result )
    } catch (error) {
        next(error)
    }
}

const deleteCard = async (req, res, next) => {  //////////////////////// this needs to be tested
    try {
        const card = await Card.findOne({
            where: {
                uuid: req.params.cardUuid
            },
            include: Board
        })
        if (card.Board.dataValues.UserId !== req.user.id) {
            throw new Error("Can't modify card you don't own")
        }
        card.destroy()
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json({
            deletedCard: card
        })
    } catch (error) {
        next(error)
    }
}

// this uses UUID rather than the PK id
const getCardsForBoard = async (req, res, next) => {
    try {
        const board = await Board.findOne({
            where: {
                uuid: req.params.boardId
            },
            include: Card
        })
        if (board.UserId !== req.user.id) {
            throw new Error("Can't query boards you don't own")
        }
        console.log( board.toJSON().Cards ) // this outputs an array of Card objects
        console.log( board.toJSON() ) // this outputs the board obj w/ cards attached
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json( board.toJSON() )
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getCards,
    postCard,
    getCard,
    updateCard,
    deleteCard,
    getCardsForBoard
}