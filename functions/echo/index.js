'use strict';

console.log("Load function");

const AWS = require("aws-sdk");
const octokit = require("@octokit/rest")();

const decrypt = (encrypted) => {
    const kms = new AWS.KMS();
    return kms.decrypt({
        CiphertextBlob: new Buffer(encrypted, 'base64')
    }).promise().then((data) => {
        return data.Plaintext.toString('ascii');
    });
};

exports.handle = (event, context, callback) => {
    let message = JSON.parse(event.Records[0].Sns.Message);
    console.log(message);
    let encryptedGithubToken = process.env['GITHUB_TOKEN'];
    decrypt(encryptedGithubToken)
        .then((token) => {
            octokit.authenticate({
                type: "oauth",
                token: token
            });

            if (message.comment.body.match(/^repeat/i)) {
                return octokit.issues.createComment({
                    owner: message.repository.owner.login,
                    repo: message.repository.name,
                    number: message.issue.number,
                    body: `@${message.sender.login}, You said "${message.comment.body}"`
                });
            } else {
                return Promise.resolve("The comment was ignored.");
            }
        }).then((resp) => {
            console.log(resp);
            callback(null, resp);
        }).catch((err) => {
            callback(err);
        });
};
