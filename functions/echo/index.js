'use strict';

const AWS = require("aws-sdk");
const octokit = require("@ocokit/rest")();

const decrypt = (encrypted) => {
    const kms = new AWS.KMS();
    return kms.decrypt({
        CiphertextBlob: new Buffer(encrypted, 'base64')
    }).promise().then((data) => {
        return data.Plaintext.toString('ascii');
    });
};

exports.handler = (event, context, callback) => {
    let message = JSON.parse(event.Records[0].Sns.Message);
    let encryptedGithubToken = process.env['GITHUB_TOKEN'];
    decrypt(encryptedGithubToken)
        .then((token) => {
            octokit.authenticate({
                type: "oauth",
                token: token
            });
            return Promise.resolve(token);
        }).then((resp) => {
            console.log(resp);
            callback(null, resp);
        }).catch((err) => {
            callback(err);
        });
};
