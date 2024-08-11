module.exports.isUserLoggedIn=(req,res,next)=>{
    if(!res.locals.user)
        return res.send({error:true,authenticated:false})
    next()
}

module.exports.isDoctorLoggedIn=(req,res,next)=>{
    if(!res.locals.doctor)
        return res.send({error:true,authenticated:false})
    next()
}

module.exports.getInstaMojoToken=async()=>{
    try {
        const getTokenOptions = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.INSTA_MOJO_CLIENT_ID, client_secret: process.env.INSTA_MOJO_CLIENT_SECRET })
        };
        let getTokenResponse = await fetch(`${process.env.INSTA_MOJO_URL}/oauth2/token/`, getTokenOptions)
        let getTokenResponseData = await getTokenResponse.json()
        return(getTokenResponseData.access_token)
    } catch (error) {
        return "";
    }
}

module.exports.generateConsultationId = () => {
    const timestamp = Date.now().toString();
    const randomNumber = Math.floor(Math.random() * 10000).toString();
    return timestamp + '-' + randomNumber;
}