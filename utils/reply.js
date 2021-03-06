/**
 * @Author: yunfei_bai
 * @Date: 2018/7/17 11:27
 * @Description:
 * */
var request = require('request');
var fs = require('fs');
var appID = require('../routes/config').appID;
var appSecret = require('../routes/config').appSecret;
var userModel = require('../model/modalFactory').userModel;
import moment from 'moment'
function replyText(msg, replyText){
    var tmpl = require('tmpl');
    var replyTmpl = '<xml>' +
        '<ToUserName><![CDATA[{toUser}]]></ToUserName>' +
        '<FromUserName><![CDATA[{fromUser}]]></FromUserName>' +
        '<CreateTime><![CDATA[{time}]]></CreateTime>' +
        '<MsgType><![CDATA[{type}]]></MsgType>' +
        '<Content><![CDATA[{content}]]></Content>' +
        '</xml>';
    if(msg.xml.MsgType[0] !== 'text'){
        if(msg.xml.MsgType[0] == 'event' && msg.xml.Event[0] =='unsubscribe'){
            let openid = msg.user.openid,params = msg.user;
            params.tagid_list=  params.tagid_list.join(',');
            params.subscribe =0;
            params.update_time =  moment().format('YYYY-MM-DD H:mm:ss');
            userModel.update(params,{
                'where':{'openid':openid}
            }).then(()=>{
                console.log('更新成功！')
            })
        }
        if(msg.xml.MsgType[0] == 'event' && msg.xml.Event[0] == 'subscribe'){
            let params = msg.user;
            params.tagid_list=  params.tagid_list.join(',');
            params.nick_name = msg.user.nickname;
            userModel.findOne({
                'where':{'openid':params.openid}
            }).then((res) =>{
                if(res){
                    console.log(111)
                    params.subscribe =1;
                    params.update_time = moment().format('YYYY-MM-DD H:mm:ss');
                    userModel.update(params,{
                        'where':{
                            'openid':params.openid,
                        }
                    }).then(()=>{
                        console.log('更新成功！')
                    })
                }else {
                    params.create_time = moment().format('YYYY-MM-DD H:mm:ss');
                    userModel.create(params).then(data => {
                        console.log('新用户关注')
                    })
                }
                })
            return tmpl(replyTmpl, {
                toUser: msg.xml.FromUserName[0],
                fromUser: msg.xml.ToUserName[0],
                type: 'text',
                time: Date.now(),
                content: replyText+'欢迎关注！'
            });
        }else if(msg.xml.MsgType[0] == 'image'){
            return tmpl(replyTmpl, {
                toUser: msg.xml.FromUserName[0],
                fromUser: msg.xml.ToUserName[0],
                type: 'text',
                time: Date.now(),
                content: replyText+'这是图片！'
            });
        }
        }else {
            if(msg.xml.Content[0] == "你好"){
                return tmpl(replyTmpl, {
                    toUser: msg.xml.FromUserName[0],
                    fromUser: msg.xml.ToUserName[0],
                    type: 'text',
                    time: Date.now(),
                    content: '你好！'
                });
            }else {
                return tmpl(replyTmpl, {
                    toUser: msg.xml.FromUserName[0],
                    fromUser: msg.xml.ToUserName[0],
                    type: 'text',
                    time: Date.now(),
                    content: replyText
                });
            }

        }

}
function getToken(){
    return new Promise(function (resolve,reject) {
        var token;
        if(fs.existsSync('test.txt')){
            token = JSON.parse(fs.readFileSync('test.txt'));
        }
        if(!token || token.timeout < Date.now()){
            request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid='+appID+'&secret='+appSecret, function(err, res, data){
                var result = JSON.parse(data);
                result.timeout = Date.now() + 7000000;
                fs.writeFileSync("test.txt", JSON.stringify(result), function(err) {
                    if(err) {
                        return console.log('111');
                    }
                    console.log("The file was saved!");
                });
                resolve(result.access_token);
            });
        }else{
            resolve(token.access_token);
        }

    });
}
module.exports = {replyText:replyText,getToken:getToken}