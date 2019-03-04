module.exports = {
    successResponse: (res, data, code) => {
        const status = code || 200;
        return res.status(status).send(data);
    },

    errorResponse: (res, error, code) => {
        const status = code || 500;
        console.log('error -', error);
        return res.status(status).send({
            data: false,
            error
        });
    },

    unspecifiedToken: res => {
        return res.status(402).send({msg: 'no token specified'});
    },

    fileNotExist: res => {
        return res.status(402).send({msg: 'file not exist'});
    },
};
