const { User } = require('../models/associationsIndex')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// get all users - admin only route, auth first
// working
const getUsers = async (req, res, next) => {
    try {
        const users = await User.findAll()
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json(users)
    } catch (error) {
        next(error)
    }
}

// create a new user (sign up) - no auth
// working
const postUser = async (req, res, next) => {
    try {
        const user = User.build(req.body)
        user.password = await hashPassword(user.password)
        await user.save()
        // this will send res with jwt as both json and cookie
        sendTokenResponse(user, 201, res)
    } catch (error) {
        next(error)
    }
}

// login - no auth
// working
const login = async (req, res, next) => {
    try {
        // console.log(req.headers)
        const { username, password } = req.body
        if (!username || !password) throw new Error("Please provide a username and password")

        const user = await User.findOne({ where: {userName: username} })    
        if (!user) throw new Error("Username does not exist")

        const isMatch = await user.matchPassword(password)
        if (!isMatch) throw new Error('Invalid Password')

        sendTokenResponse(user, 200, res)
    } catch (error) {
        next(error)
    }
}

// this is to log in via a previously saved cookie containing a JWT token
const authenticate = async (req, res, next) => {
    try {
        let token
        req.headers.cookie ? console.log("Cookie: ", req.headers.cookie) : null
        if (req.headers.cookie && req.headers.cookie.startsWith('token') ) {
            const tempTokenValue = req.headers.cookie.split("=")[1]
            if (tempTokenValue !== "none") token = tempTokenValue
        }

        if (!token) {
            console.log("Auth: not logged in via cookie")
            res
            .status(200)
            .setHeader('Content-Type', 'application/json')
            .json({success: false, msg: "Not logged in via cookie"})
        } else {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            // console.log("Decoded JWT: ", decoded)
    
            const user = await User.findByPk(decoded.id)
            sendTokenResponse(user, 200, res)
        }
    } catch (error) {
        next(error)
    }
}

// update password - authenticate first
// working
const updatePassword = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id)

        const passwordMatches = await user.matchPassword(req.body.password)
        if (!passwordMatches) throw new Error('Password is incorrect')

        user.password = await hashPassword(req.body.newPassword)
        await user.save()

        sendTokenResponse(user, 200, res)
    } catch (error) {
        next(error)
    }
}

// logout - authenticate first
// working
const logout = async (req, res, next) => {
    try {
        res.cookie('token', 'none', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        })
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json({success: true, msg: "Successfully logged out"})
    } catch (error) {
        next(error)
    }
}

// get a single user - authenticate first 
// working
const getUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id)
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json(user)
    } catch (error) {
        next(error)
    }
}

// update user info - authenticate first 
// working
const updateUser = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id)

        if (req.body.userName) user.userName = req.body.userName
        if (req.body.email) user.email = req.body.email
        //if (req.body.password) user.password = req.body.password
        if (req.body.admin) user.admin = req.body.admin

        const result = await user.save()
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json(result)
    } catch (error) {
        next(error)
    }
}

// delete a single user - auth first 
// working
const deleteUser = async (req, res, next) => {
    try {
        const result = await User.destroy({
            where: { id: req.user.id }
        })
        res
        .status(200)
        .setHeader('Content-Type', 'application/json')
        .json({
            deletedItems: result,
            deletedUser: req.user
        })
    } catch (error) {
        next(error)
    }
}

const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken()
    
    const userInfo = {}
    userInfo.id = user.id
    userInfo.username = user.userName
    if (user.email) userInfo.email = user.email
    userInfo.admin = user.admin

    const options ={
        expires: new Date( Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000 ),
        httpOnly: false, ///////////////////////might want to change this to httpOnly true
        secure: true,    ///////////////
        sameSite: 'none', //////////////
    }
    res
    .status(statusCode)
    .cookie('token', token, options )
    .json({success: true, user: userInfo, token})
}

// function to hash the plain text password
const hashPassword = async (unhashedPassword) => {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(unhashedPassword, salt)
    return hashedPassword
}

module.exports = {
    getUsers,
    postUser,

    login,
    authenticate,
    updatePassword,
    logout,

    getUser,
    updateUser,
    deleteUser,
}
