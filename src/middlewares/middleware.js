const jwt = require('jsonwebtoken')
/////////////////////////////authenticator//////////////////////////////////////
const authorize = function (req, res, next) {
    try {
        let id = req.params.userId
        let token = req.headers.authorization
        if (!id) {
            return res.status(400).send({ status: false, 'message': 'id is required' })
        }
        if (!token) {
            return res.status(400).send({ status: false, 'message': 'token is required' })
        }
        let code
        let array = token.split(" ")
        if (array[0] === 'Bearer') {
            code = array[1]
        }
        let decodedToken = jwt.verify(code, 'AmanTandon')
        let tid = decodedToken.id
        if (tid) {
            req.headers['tid']=tid
            next()
            
        }
        else {
            return res.status(402).send({ status: false, 'msg': 'authorization  failed' })
        }
    }
    catch (err) {
        res.status(500).send({ status: false, 'msg': err })
    }
}
/////////////////////////////////////////////////////////////////////////////////////////
module.exports = { authorize }