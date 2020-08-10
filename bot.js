const VkBot = require('node-vk-bot-api');
const { VK } = require('vk-io')
const ax = require('axios');
const easyvk = require('easyvk')
const VK_TOKEN = "4a42b111a405e5eb301a884c92d9387b72967cb08e90bfa92062c6b14c1b96cf6697654304af7c3dbb476";
const OWM_TOKEN = 'da0fb5761764429a716517725a57374f';
const NEWS_TOKEN = 'b23a34c77d834a399dcda0ee3dce73dd';
const bot = new VkBot(VK_TOKEN);

bot.command(/^начать/i, async (ctx) => {
    await ctx.reply('Функции бота: \n 1. Просмотр погоды (команда: "погода {город}"): просмотор погоды в выбранном городе в данный момент \n 2. Показать случайную новость (команда: новости или news)');
});

bot.command(/^(?:погода|weather) ([a-zA-Z]+|[а-яА-Я]+)$/i, async (ctx) => {
    let uri = `http://api.openweathermap.org/data/2.5/weather?q=${ctx.match[1]}&appid=${OWM_TOKEN}&units=metric`;
    let encoded = encodeURI(uri)
    ax.get(`${encoded}`).then(res => {
            let tempObj = res.data.main;
            let temp = tempObj.temp;
            let tempFeelsLike = tempObj.feels_like;
            let pressure = tempObj.pressure;
            let humidity = tempObj.humidity;
            ctx.reply(`${temp} градусов по цельсию, ощущается как ${tempFeelsLike}, давление ${pressure}, влажность ${humidity}`)
        }
        
    ).catch(error => ctx.reply("Такого города нет"))
});

bot.command(/^новости|news/i, async (ctx) => {
    ax.get(`https://newsapi.org/v2/top-headlines?country=ru&apiKey=b23a34c77d834a399dcda0ee3dce73dd`).then(res => {
        let newsArray = res.data.articles;
        let article = newsArray[Math.floor(Math.random() * newsArray.length)];

        let articleImage = article.urlToImage;
              
        let source = article.source.name;
        let title = article.title;
        let description = article.description;
        let articleUrl = article.url;
        let msg = `источник: ${source} \n\n ${title} \n ${description} \n читать полностью: ${articleUrl}`

        uploadPhotoToServer(articleImage, ctx, msg);
    })
});

bot.command(/^(?:перевод|translate) ([a-zA-Z]+) ("([^"]*)")$/i, async (ctx) => { 
    ax({
        "method": "GET",
        "url": "https://language-translation.p.rapidapi.com/translateLanguage/translate",
        "headers": {
        "content-type": "application/octet-stream",
        "x-rapidapi-host": "language-translation.p.rapidapi.com",
        "x-rapidapi-key": "b21dc0a5c8msh99996a35636b826p119283jsnfdffea2f6cb2",
        "useQueryString": true
        }, "params" :{
        "text": `${ctx.match[3]}`,
        "type": "plain",
        "target": `${ctx.match[1]}`
        }
        })
        .then((res)=>{
          ctx.reply(`${res.data.translatedText} (переведено с ${res.data.detectedLanguageCode})`)
        })
        .catch((error)=>{
          console.log(error)
        })
})

function makeId(limit) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < limit; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

function uploadPhotoToServer(photoFileUrl, context, msg) {
    let Vk = null;

    easyvk({
        token: VK_TOKEN
    }).then(_vk => {

        Vk = _vk;

        return Vk.uploader.getUploadURL(
        'photos.getMessagesUploadServer', {}, true
        )

    }).then(async ({url, vkr}) => {

        const field = 'photo'
        const server = Vk.uploader
        const fileUrl = photoFileUrl


        url = url.upload_url

        let fileData = await server.uploadFetchedFile(url, fileUrl, field, {})

        fileData = await Vk.post('photos.saveMessagesPhoto', fileData)
        fileData = fileData[0]

        const attachments = [
        `photo${fileData.owner_id}_${fileData.id}_${fileData.access_key}`
        ]

        context.reply(msg, attachments[0])
    })
};
 
console.log("started")
bot.startPolling();



