const pinataSDK = require('@pinata/sdk');

const pinataApiKey = process.env.pinata_api_key;
const pinataSecretApiKey = process.env.pinata_secret_api_key;

const pinata = pinataSDK(pinataApiKey, pinataSecretApiKey);

const getPreviousHash = async (hash) => { 
    // blockchain call to be written for getting the next node
    return;
}

const pushHash = async (hash, prev_hash) => {
    // blockchain call to be written for pushing the node
    return;
}

const pinJSONToIPFS = async (res, metadata) => {
    try {
        console.log(metadata);
        const {msg, user, time} = metadata;
        if (!time || !msg || !user) {
            throw new Error('Please provide all and valid details!');
        }

        const auth = await pinata.testAuthentication();
        const options = {
            pinataMetadata: {
                name: user.toString() + '---' + time.toString(),
                keyvalues: {
                    user: 'v0' + user.toString(),
                },
            },
            pinataOptions: {
                cidVersion: 1,
            },
        };

        console.log(options);

        const result = await pinata.pinJSONToIPFS({ ...metadata }, options);
        console.log(result);
        if (!result.IpfsHash || !result.PinSize) {
            throw new Error('IpfsHash or PinSize not defined');
        }
        return result.IpfsHash;
        // res.status(200).json({ status: true, msg: 'pinned successfully', hash: result.IpfsHash, result });
    } catch (err) {
        console.log(err);
        
    }
};

const handleSend = async (req, res) => { 
    let { msg, user, time } = req.body;
    if (!time) time = new Date().getTime();

    const hash = await pinJSONToIPFS(res, { msg, user, time });
    
    await pushHash(hash, -1);

    res.status(200).json(hash);

}

const handleForward = async (req, res) => { 
    const { msg, user, time, prev_user, prev_time } = req.body;
    let prev_hash = await pinJSONToIPFS(res, { msg, user: prev_user, time: prev_time });
    console.log('previous hash', prev_hash);

    let hash = await pinJSONToIPFS(res, { msg, user, time });
    console.log('hash', hash);

    await pushHash(hash, prev_hash);

    res.status(200).json({prev_hash, hash});
}

const handleTrack = async (req, res) => {
    let { msg, user, time } = req.body;
    if (!time) time = new Date().getTime();

    const hash = await pinJSONToIPFS(res, { msg, user, time });
    
    let prev_hash = "";
    let i = 0;
    while (hash !== -1) {
        prev_hash = hash;
        hash = await getPreviousHash(hash);
        console.log(`hash ${i}: `, hash);
        i++;
    }

    res.status(200).json('origin hash', prev_hash);

}

module.exports = {handleSend, handleForward, handleTrack}
