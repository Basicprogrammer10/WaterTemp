const common = require('../../src/common');

function discord(alert, config) {
    let discordConfig = config.alerts.alertMessage.webhook;
    common
        .post(
            alert,
            'discord.com',
            443,
            `/api/webhooks/${discordConfig.id}/${discordConfig.token}`
        )
        .then(() => common.log('📨 Discord Webhook Sent'))
        .catch(err => {
            common.log(`🛑 Error Sending Webhook: ${err}`);
        });
}

function email(subject, text, config) {
    let emailConfig = config.alerts.alertMessage.email;
    if (!emailConfig.enabled) return;

    const nodemailer = require('nodemailer');

    let transporter = nodemailer.createTransport(emailConfig.sender);

    var mailOptions = {
        from: emailConfig.sender.auth.user,
        to: emailConfig.sendTo.join(', '),
        subject,
        text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            common.log(`📧 Error Sending Mail: ${error}`);
            return;
        }
        common.log(`📧 Alert Email sent: ${info.response}`);
    });
}

module.exports = { discord, email };
