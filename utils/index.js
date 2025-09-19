import axios from 'axios'
import {createCipheriv } from 'crypto'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {HttpsProxyAgent} from 'https-proxy-agent'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const generateVerifyFp = async()=> {
    var e = Date.now();
    var t = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(
        ""
        ),
        e = t.length,
        n = Date.now().toString(36),
        r = [];
    (r[8] = r[13] = r[18] = r[23] = "_"), (r[14] = "4");
    for (var o = 0, i = void 0; o < 36; o++)
        r[o] ||
        ((i = 0 | (Math.random() * e)), (r[o] = t[19 == o ? (3 & i) | 8 : i]));
    return "verify_" + n + "_" + r.join("");
} 
const  xttparams= async(query_str) =>{
    query_str += "&is_encryption=1";
    const password = "webapp1.0+202106";
    // Encrypt query string using aes-128-cbc
    const cipher = createCipheriv("aes-128-cbc", password, password);
    return Buffer.concat([cipher.update(query_str), cipher.final()]).toString(
        "base64"
    );
}
const axiosApiCookie = async({signed_url,proxy,page})=> {
    let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    const cookieAxios = await page.cookies()
    let cookieString  =''
    for(let i=0;i<cookieAxios.length;i++){
        cookieString = cookieString+cookieAxios[i].name+"="+cookieAxios[i].value+";"
    }   
    const response = await axios(signed_url, {
        timeout:20000,
        httpsAgent: new HttpsProxyAgent(proxy.proxy),
        headers:{
            "user-agent": userAgent,
            "cookie":cookieString
        }
      });
    return response
}
const axiosApi = async({signed_url,proxy})=> {
    let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    const response = await axios(signed_url, {
        timeout:10000,
        httpsAgent: new HttpsProxyAgent(proxy.proxy),
        headers:{
            "user-agent": userAgent,
        }
      });
    return response
}
const axiosApiNoProxy = async({signed_url,proxy})=> {
    let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    const response = await axios(signed_url, {
        timeout:20000,
        // httpsAgent: new HttpsProxyAgent(proxy.proxy),
        headers:{
            "user-agent": userAgent,
        }
      });
    return response
}
const axiosApiLogin = async({signed_url,proxy,cookieAxios})=> {
    let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    let cookieString =''
    for(let i=0;i<cookieAxios.length;i++){
        cookieString = cookieString+cookieAxios[i].name+"="+cookieAxios[i].value+";"
    }
    const response = await axios(signed_url, {
        timeout:30000,
        httpsAgent: new HttpsProxyAgent(proxy.proxy),
        headers:{
            "user-agent": userAgent,
            "cookie":cookieString
        }
      });
    return response
}
const axiosApiLoginSource = async({signed_url,proxy,cookieAxios})=> {
     let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    // let cookieString =''
    // for(let i=0;i<cookieAxios.length;i++){
    //     cookieString = cookieString+cookieAxios[i].name+"="+cookieAxios[i].value+";"
    // }
    const response = await axios(signed_url, {
        timeout:30000,
        // httpsAgent: new HttpsProxyAgent(proxy.proxy),
        headers:{
            "Content-Type": "application/json",
            "Cookie":"msToken=695VpGxgP10PLB_SB_t0l7S03M3jp1G6AlCfPBHpYhMBvVSgvB3tTxe7YtAJqqoXDvdztS4ZvNvtklIqU8MyEoHJa1uLX1unE4ZZr1nrGiiydXxUvY3kmpeEgCCoDjFkVseFLH6FdKH29Q==; odin_tt=15422c445b2725589a2d28aea4e5acc0ca934ca15990efdc9daed49b5f0566e8419be294cd8f77e55e9ff092c24a73d7229e291b41cfdfae2e4bca4b06f0e76d8adb758dde5f11fdc9cbd44132f9da28",
            // "Cookie":"delay_guest_mode_vid=5; tt-target-idc-sign=r_I9q5E8ikIqZP_tfVASeiWXVid1BmgrIA0M7OKdZHa2UBorxMuYfdcvDJDtjKSdHbebuSLlMKagEQOpMBFFfy_iWb4kWiz2JCHpu237tuv5vIc-2riFhFZyl6OjNL6tOLoI3e7_ysv9AzHOfhs592BWhNMraQAJ3_JFvF4c55MOuhVZXsEL6Of9olRNZlim7k8IWNiVBZGoMHWXIC9p5i9mzqQfUl1I0nsTlLUtA-9obJM6dBmFXVWJEZabWjZAJPxDEmX0aMFvVReluqqvj4ejELCVzThaV2mXUpeLF-Xt_7Na4I8olbHvF39L5ZrMtnDJTdWGzr3a8bs44av9frCTkfQhtC3hhqq_7NZzUDcjxu101KMMRpzKQaMswyXmjBqXDcQY9cOsuEwxho9dxzHeumAvQvMxlXtTDesOsi3JrddpCE-bAkHhIEQ1IZFdbY3wOl6qcE3WtOMw-ZDYyuze7j2vWfHVorga8rvZAddj7s29X8NzT8qiG6WmvZNZ; tt-target-idc=alisg; tt_chain_token=du5ABb8FQfntWz26FNMCzg==; store-idc=alisg; store-country-code-src=uid; tiktok_webapp_theme=light; uid_tt=4517940377b40d1efa798400eec346767ac00ecd33b493aa100f199b21515645; sessionid=c76f1251ef39945aced5c4dab663b482; uid_tt_ss=4517940377b40d1efa798400eec346767ac00ecd33b493aa100f199b21515645; sid_tt=c76f1251ef39945aced5c4dab663b482; sid_guard=c76f1251ef39945aced5c4dab663b482%7C1754837217%7C10501409%7CWed%2C+10-Dec-2025+03%3A50%3A26+GMT; store-country-code=vn; sessionid_ss=c76f1251ef39945aced5c4dab663b482; tiktok_webapp_theme_source=system; passport_csrf_token=971f14268dc3d9688af0641883ea3d79; passport_csrf_token_default=971f14268dc3d9688af0641883ea3d79; tt_csrf_token=1PWGH6EH-mqB_UfUnOtREXY9avhiz32_RGCY; passport_fe_beating_status=true; s_v_web_id=verify_mec7rk21_l0SLjzV9_1sNg_4aU2_Byl9_ia8Cejaq749S; odin_tt=4c871679353c1b9d81319a5225be5463816c6714e90b4d31844d8937d90922a4580dc72f703b92c0b7cb8c4402eac7f6c0b1f01b42e3aae469339a616cfb65d9; perf_feed_cache={%22expireTimestamp%22:1755396000000%2C%22itemIds%22:[%227512844597383449863%22%2C%227530490139756317970%22%2C%227510594489849777426%22]}; ttwid=1%7CbI2PCD4sV5ecganHwj63kroKLhOa8inPbdnBGo1_kNQ%7C1755225208%7Cc929fc9870a071d24f656b956a7b87508a0846c59433b78b9968009d738c407d; store-country-sign=MEIEDCc2p31Gsxf93IpJpgQg0Vaxbaa6WVVw15eNZW7-pCG7giDT05qxadn6ef7hSLgEEBUk-Cs2MhnTkI6HwrlGcCE; msToken=D_myJgmNBlRZuuXRnhPBtmwnNl5tY2tp4YlPdcnY-VgTCX5pHoOEDiHs3BFpSDAQrXCokJZcIIgrUhZ--Qje2dF1BGaZvl5jy89OOV-CIsu_zLB3z4Z1otnsm8XLxVLxtld0c41eG-Y8Ag==; odin_tt=ad84d8b1225bb53e6a3ef342f94524448a91af0674b36e0cca7194928e0e715343c8024682aa54d4e431943ad4967bbab32fbf8480e76d893e1e32e2bdcb6cd23747490435c7139aa9f352490c6528dc; msToken=IMkCBb2dN2FL9KH6GQ5DvAw99pgWISFj7VdUgC9Bye6r7_uHBcmXuSfpJpaI4UsK-DOlvTv0qOFLgYdZS3iXZSYrlEOicbf6O52DTKrRKT4MFJm0ulQ82p5Zam8xg-gBDDJyqDThKDb4Gg==",
            "User-Agent": userAgent,
        }
      });
    return response
}
const signUrl = async ({PARAMS,firstUrl,page})=>{
    const qsObject = new URLSearchParams(PARAMS) ;
    const qs = qsObject.toString();
    let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    const unsignedUrl = `${firstUrl}${qs}`;
    let verify_fp = await generateVerifyFp();
    let newUrl = unsignedUrl + "&verifyFp=" + verify_fp;
    let token = await page.evaluate(`generateSignature("${newUrl}")`);
    let signed_url = newUrl + "&_signature=" + token;
    let queryString = new URL(signed_url).searchParams.toString();
    let bogus = await page.evaluate(`generateBogus("${queryString}","${userAgent}")`);
    signed_url += "&X-Bogus=" + bogus;  
    return signed_url
}
const signUrlSource = async ({PARAMS,firstUrl,page})=>{
    const qsObject = new URLSearchParams(PARAMS) ;
    const qs = qsObject.toString();
    let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    const unsignedUrl = `${firstUrl}${qs}`;
    let verify_fp = await generateVerifyFp();
    let newUrl = unsignedUrl + "&verifyFp=" + verify_fp;
    let token = await page.evaluate(`generateSignature("${newUrl}")`);
    let signed_url = newUrl + "&_signature=" + token;
    let queryString = new URL(signed_url).searchParams.toString();
    let bogus = await page.evaluate(`generateBogus("${queryString}","${userAgent}")`);
    signed_url += "&X-Bogus=" + bogus;  
    return signed_url
}

const signUrlByUrl = async ({unsignedUrl,page})=>{
    const cookie = await page.cookies()
    const msToken = cookie.filter((item)=>item.name=='msToken')[0]
    console.log(msToken)
    let userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    let verify_fp = await generateVerifyFp();
    let newUrl = unsignedUrl +`&msToken=${msToken.value}`
    let token = await page.evaluate(`generateSignature("${newUrl}")`);
    let signed_url = newUrl + "&_signature=" + token;
    let queryString = new URL(signed_url).searchParams.toString();
    let bogus = await page.evaluate(`generateBogus("${queryString}","${userAgent}")`);
    signed_url += "&X-Bogus=" + bogus;  
    return signed_url
    // let token = await page.evaluate(`generateSignature("${newUrl}")`);
    // let signed_url = newUrl + "&_signature=" + token;

    // let queryString = new URL(signed_url).searchParams.toString();
    // let bogus = await page.evaluate(`generateBogus("${queryString}","${userAgent}")`);
    // signed_url += "&X-Bogus=" + bogus;  

    return signed_url
}

const pageSign = async({page})=>{
    let LOAD_SCRIPTS = ["signer.js", "webmssdk.js", "xbogus.js"];
    LOAD_SCRIPTS.forEach(async (script) => {
    await page.addScriptTag({
        path: `${__dirname}/javascript/${script}`,
    });
    // console.log("[+] " + script + " loaded");
    });
    await page.evaluate(() => {
        window.generateSignature = function generateSignature(url) {
            if (typeof window.byted_acrawler.sign !== "function") {
            throw "No signature function found";
            }
            return window.byted_acrawler.sign({ url: url });
        };
        window.generateBogus = function generateBogus(params) {
            if (typeof window.generateBogus !== "function") {
            throw "No X-Bogus function found";
            }
            return window.generateBogus(params);
        };
        return this;
    });

}

export {
    axiosApiCookie,
    pageSign,
    xttparams,
    signUrl,
    axiosApi,
    generateVerifyFp,
    axiosApiNoProxy,
    axiosApiLogin,
    signUrlByUrl,
    axiosApiLoginSource,
    signUrlSource
}

