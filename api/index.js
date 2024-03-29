const request = require("request-promise");
const axios = require("axios")

const cheerio = require("cheerio");
const fs = require("fs");
const qs = require('qs');
const crypto = require("crypto");


if (!fs.existsSync("./images"))
	fs.mkdirSync("./images");

const now_time = new Date();

module.exports = {
	CLIENT_ID: 'MOBrBDS8blbauoSck0ZfDbtuzpyT',
	CLIENT_SECRET: "lsACyCD94FhDUtGTXi3QzcFE2uU1hqtDaKeqrdwj",
	HASH_SECRET: '28c1fdd170a5204386cb1313c7077b34f83e4aaf4aa829ce78c231e05b0bae2c',


	local_time: `${now_time.getUTCFullYear()}-${now_time.getUTCMonth() +
		1}-${now_time.getUTCDate()}T${now_time
			.getUTCHours()
			.toString()
			.padStart(2, '0')}:${now_time
				.getUTCMinutes()
				.toString()
				.padStart(2, '0')}:${now_time
					.getUTCSeconds()
					.toString()
					.padStart(2, '0')}+00:00`,

	download: function (uri) {
		function getUrl(uri) {
			return new Promise((resolve) => {
				let id = uri.slice(uri.indexOf("artworks/") + 9, uri.length);
				request({
					headers: {
						'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0',
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
						'Accept-Language': 'en-US,en;q=0.5',
						'Connection': 'keep-alive',
						'Upgrade-Insecure-Requests': '1',
						'Pragma': 'no-cache',
						'Cache-Control': 'no-cache',
						'TE': 'Trailers',
					},
					uri: "https://www.pixiv.net/ajax/illust/" + id,
					json: true
				}).then(res => {
					if (!res.error) {
						resolve({
							img: res.body.urls.regular,
							id: id
						});
					}
					else resolve(null);
				});
			});
		}
		if (typeof uri == "object") {
			if (typeof uri[0] == "object") {
				Promise.all(uri.map(el => load(el.img, el.id, this.download)))
			}
			else {
				Promise.all(uri.map(getUrl)).then((res) => { res.map((el) => { load(el.img, el.id, this.download) }) })
			} 
		}
		function load(url, id, func) {
			if (url !== undefined) {
				return new Promise((reject) => {
					request({
						headers: {
							Referer: "https://www.pixiv.net/ajax/illust/" + id
						},
						uri: url
					})
						.pipe(fs.createWriteStream("./images/" + id + url.slice(url.length-4,url.length)))
						.on("close", function () {
							console.log("save " + id + "." + url.slice(url.length - 3, url.length));
						});
				})
			} else func(["https://www.pixiv.net/member_illust.php?mode=medium&illust_id=" + id]);
		}
	},
	getUserWork: function (userID, opt, n = 0) {
		return new Promise((resolve) => {
			let queryString = qs.stringify({ user_id: userID, filter: 'for_ios', offset: n });
			illust_arr = []
			this.getAuthAccessToken(opt, (token) => {
				request({
					headers: {
						'App-OS': 'ios',
						'Accept-Language': 'en-us',
						'App-OS-Version': '9.3.3',
						'App-Version': '7.1.11',
						'User-Agent': 'PixivIOSApp/7.1.11 (iOS 9.0; iPhone8,2)',
						Authorization: token
					},
					uri: "https://app-api.pixiv.net/v1/user/illusts?" + queryString,
					json: true
				}).then(json => { //232
					if (json != undefined)
						json.illusts.forEach(el => {
							if (el.meta_single_page.original_image_url !== undefined)
								illust_arr.push({
									img: el.meta_single_page.original_image_url,
									id: el.id
								});
							console.log(illust_arr);	
							resolve((json.illusts != []) ? illust_arr : []);
						})
					else resolve([]);
				});
			});
		});
	},
	downloadAll: function (userID, opt, n = 0) {
		this.getUserWork(userID, opt, n).then(res => {
			this.download(res);
			return res
		}).then(res => {
			if (res != []) {
				this.downloadAll(userID, opt, n + 30);
			}
		});
	},
	downloadMangaSeries: function (uri) {
		let id = (uri.length > 10) ? uri.slice(uri.indexOf("illust_id=") + 10, uri.length) : uri;
		this.loadMangaSeriesUrl(id);
		this.loadMangaSeriesUrl(id, false);
	},
	loadMangaSeriesUrl: function (id, opt = true) {
		return new Promise((resolve) => {
			request({
				headers: {
					Cookie: "PHPSESSID=20496492_520b5dfd42e6fcc7768ad74a91a60bc9; p_ab_id=2; p_ab_id_2=4; yuid=cwYFh5A55; tag_view_ranking=0xsDLqCEW6~RTJMXD26Ak~BU9SQkS-zU~Lt-oEicbBr~GX5cZxE2GY~y8GNntYHsi~b_G3UDfpN0~zyKU3Q5L4C~yZf1XmIy-U~nriWjM9urd~azESOjmQSV~iFcW6hPGPU~KN7uxuR89w~gooMLQqB9a~EGefOqA6KB~NpsIVvS-GF~ueeKYaEKwj~Ie2c51_4Sp~tgP8r-gOe_~qiO14cZMBI~Is0SiXyaWb~qtVr8SCFs5~qvqXJkzT2e~HY55MqmzzQ~pzzjRSV6ZO~81BOcT1ZAV~y68AFldGp7~65aiw_5Y72~q303ip6Ui5~RcahSSzeRf~xjfPXTyrpQ~jH0uD88V6F~K955v_aHrk~ZTBAtZUDtQ~QaiOjmwQnI~oM6PN-jdfE~Kw3rxm81BS~D8cfQCDYAl~FH69TLSzdM~Bd2L9ZBE8q~CLR9k9dHAQ~RVRPe90CVr~uusOs0ipBx~zIv0cf5VVk~xZ6jtQjaj9~X_1kwTzaXt~YRDwjaiLZn~1HSjrqSB3U~e4Va3SNH5h~VN7cgWyMmg~x_jB0UM4fe~dehCwztzpj~oCR2Pbz1ly~jhuUT0OJva~OT4SuGenFI~kP7msdIeEU~WY10GFG4q3~a-IhwNF_3B~-mU9m7LQEj~nRp2ZLPLbj~udkRh_mjvd~pYlUxeIoeg~j3leh4reoN~1F9SMtTyiX~XEuS3TPyCa~kym2Z4vnZu~JO16HzBgpd~BuxH2AvtZ9~-L-4bBqjrT~rezgCfkPbs~SJK3YcGD-h~K0LWjp4M-c~AaBbSF1H2D~aKAp3RlsBg~Ltq1hgLZe3~LVSDGaCAdn~pnCQRVigpy~EUwzYuPRbU~3mLXnunyNA~kkoONtHi_j~IQ7tgDp_ul~fryDCikS2a~CbmkqBJulM~q3eUobDMJW~89uzPVUy9U~wsim4__rTI~KhVXu5CuKx~HZCnKGc7Gi~X1ZSbphPDx~kGYw4gQ11Z~qWFESUmfEs~ay54Q_G6oX~9TPuxVVpm_~5RvyKm3yea~juumLY9DfB~OVcez6CxIO~HrwdVe4iWc~agX61qa9EJ~iOH7DNLGY6~ZeF-yPWEA5; __utma=235335808.224054593.1525685806.1525685806.1525685833.2; __utmz=235335808.1525685833.2.2.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); __utmv=235335808.|2=login%20ever=yes=1^3=plan=normal=1^5=gender=male=1^6=user_id=20496492=1^9=p_ab_id=2=1^10=p_ab_id_2=4=1^11=lang=en=1; _ga=GA1.2.224054593.1525685806; c_type=18; a_type=0; b_type=1; module_orders_mypage=%5B%7B%22name%22%3A%22sketch_live%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22tag_follow%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22recommended_illusts%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22showcase%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22everyone_new_illusts%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22following_new_illusts%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22mypixiv_new_illusts%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22fanbox%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22featured_tags%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22contests%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22user_events%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22sensei_courses%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22spotlight%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22booth_follow_items%22%2C%22visible%22%3Atrue%7D%5D; login_ever=yes; first_visit_datetime_pc=2018-05-28+16%3A24%3A47; privacy_policy_agreement=1; is_sensei_service_user=1; manga_viewer_expanded=1",
					Referer: "https://www.pixiv.net/member_illust.php?mode=manga&illust_id=" + id
				},
				uri: "https://www.pixiv.net/ajax/illust/" + id,
				json: true
			}).then((res) => {
				if (res.body.seriesNavData === null) {
					if (!fs.existsSync("./" + res.body.illustTitle))
						fs.mkdirSync("./" + res.body.illustTitle);
					return this.downloadManga({ id: id, title: res.body.illustTitle, index: 0 }, "./" + res.body.illustTitle);
				}
				let path = "./" + res.body.seriesNavData.title + "/" + "chap " + res.body.seriesNavData.order
				if (!fs.existsSync("./" + res.body.seriesNavData.title))
					fs.mkdirSync("./" + res.body.seriesNavData.title);
				if (!fs.existsSync(path))
					fs.mkdirSync(path);
				this.downloadManga({
					id: id,
					title: res.body.seriesNavData.title,
					index: res.body.seriesNavData.order
				}, path);
				let nextid = (res.body.seriesNavData.next != null) ? res.body.seriesNavData.next.id : null
				let previd = (res.body.seriesNavData.prev != null) ? res.body.seriesNavData.prev.id : null
				if (opt) {
					if (res.body.seriesNavData.next != null)
						this.loadMangaSeriesUrl(nextid, true)
				}
				else if (res.body.seriesNavData.prev != null)
					this.loadMangaSeriesUrl(previd, false)
			})
		})
	},
	downloadManga: function ({ id, title, index }, path) {
		request({
			headers: {
				Cookie: "PHPSESSID=20496492_520b5dfd42e6fcc7768ad74a91a60bc9; p_ab_id=2; p_ab_id_2=4; yuid=cwYFh5A55; tag_view_ranking=0xsDLqCEW6~RTJMXD26Ak~BU9SQkS-zU~Lt-oEicbBr~GX5cZxE2GY~y8GNntYHsi~b_G3UDfpN0~zyKU3Q5L4C~yZf1XmIy-U~nriWjM9urd~azESOjmQSV~iFcW6hPGPU~KN7uxuR89w~gooMLQqB9a~EGefOqA6KB~NpsIVvS-GF~ueeKYaEKwj~Ie2c51_4Sp~tgP8r-gOe_~qiO14cZMBI~Is0SiXyaWb~qtVr8SCFs5~qvqXJkzT2e~HY55MqmzzQ~pzzjRSV6ZO~81BOcT1ZAV~y68AFldGp7~65aiw_5Y72~q303ip6Ui5~RcahSSzeRf~xjfPXTyrpQ~jH0uD88V6F~K955v_aHrk~ZTBAtZUDtQ~QaiOjmwQnI~oM6PN-jdfE~Kw3rxm81BS~D8cfQCDYAl~FH69TLSzdM~Bd2L9ZBE8q~CLR9k9dHAQ~RVRPe90CVr~uusOs0ipBx~zIv0cf5VVk~xZ6jtQjaj9~X_1kwTzaXt~YRDwjaiLZn~1HSjrqSB3U~e4Va3SNH5h~VN7cgWyMmg~x_jB0UM4fe~dehCwztzpj~oCR2Pbz1ly~jhuUT0OJva~OT4SuGenFI~kP7msdIeEU~WY10GFG4q3~a-IhwNF_3B~-mU9m7LQEj~nRp2ZLPLbj~udkRh_mjvd~pYlUxeIoeg~j3leh4reoN~1F9SMtTyiX~XEuS3TPyCa~kym2Z4vnZu~JO16HzBgpd~BuxH2AvtZ9~-L-4bBqjrT~rezgCfkPbs~SJK3YcGD-h~K0LWjp4M-c~AaBbSF1H2D~aKAp3RlsBg~Ltq1hgLZe3~LVSDGaCAdn~pnCQRVigpy~EUwzYuPRbU~3mLXnunyNA~kkoONtHi_j~IQ7tgDp_ul~fryDCikS2a~CbmkqBJulM~q3eUobDMJW~89uzPVUy9U~wsim4__rTI~KhVXu5CuKx~HZCnKGc7Gi~X1ZSbphPDx~kGYw4gQ11Z~qWFESUmfEs~ay54Q_G6oX~9TPuxVVpm_~5RvyKm3yea~juumLY9DfB~OVcez6CxIO~HrwdVe4iWc~agX61qa9EJ~iOH7DNLGY6~ZeF-yPWEA5; __utma=235335808.224054593.1525685806.1525685806.1525685833.2; __utmz=235335808.1525685833.2.2.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not%20provided); __utmv=235335808.|2=login%20ever=yes=1^3=plan=normal=1^5=gender=male=1^6=user_id=20496492=1^9=p_ab_id=2=1^10=p_ab_id_2=4=1^11=lang=en=1; _ga=GA1.2.224054593.1525685806; c_type=18; a_type=0; b_type=1; module_orders_mypage=%5B%7B%22name%22%3A%22sketch_live%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22tag_follow%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22recommended_illusts%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22showcase%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22everyone_new_illusts%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22following_new_illusts%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22mypixiv_new_illusts%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22fanbox%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22featured_tags%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22contests%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22user_events%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22sensei_courses%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22spotlight%22%2C%22visible%22%3Atrue%7D%2C%7B%22name%22%3A%22booth_follow_items%22%2C%22visible%22%3Atrue%7D%5D; login_ever=yes; first_visit_datetime_pc=2018-05-28+16%3A24%3A47; privacy_policy_agreement=1; is_sensei_service_user=1; manga_viewer_expanded=1",
				Referer: "https://www.pixiv.net/member_illust.php?mode=manga&illust_id=" + id
			},
			uri: "https://www.pixiv.net/ajax/illust/" + id,
			json: true
		}).then((res) => {
			let or = res.body.urls.original;
			let date = or.slice(or.indexOf("img/") + 4, or.length - 7);
			/* get index */
			request({
				headers: {
					Referer: "https://www.pixiv.net/member_illust.php?mode=manga&illust_id=" + id
				},
				uri: "https://www.pixiv.net/member_illust.php?mode=manga&illust_id=" + id
			}).then((res) => {
				let $ = cheerio.load(res);
				let index = $(res).find('div.item-container').length;
				for (let i = 0; i < index; ++i)
					down(date, i);
			})
			function down(date, n = 0) {
				let options = {
					headers: {
						Referer: "https://www.pixiv.net/ajax/illust/" + id
					},
					url: "https://i.pximg.net/img-master/img/" + date + "_p" + n + "_master1200.jpg",
					encoding: null,

				};
				request.get(options)
					.then(function (res) {
						let data = Buffer.from(res, 'utf8');
						fs.writeFileSync(path + '/' + 'image' + (n + 1) + '.jpg', data);
					});
				console.log("save " + path + '/' + 'image' + (n + 1) + '.jpg');
			}
		});
	},

	getAuthAccessToken: function ({ username, password }, callback = () => { }) {
		
		axios({
			url: "https://oauth.secure.pixiv.net/auth/token",
			headers: {
				'X-Client-Time': this.local_time,
				'X-Client-Hash': crypto
					.createHash('md5')
					.update(Buffer.from(`${this.local_time}${this.HASH_SECRET}`, 'utf8'))
					.digest('hex')
			},
			data: qs.stringify({
				client_id: this.CLIENT_ID,
				client_secret: this.CLIENT_SECRET,
				get_secure_url: 1,
				grant_type: 'password',
				refresh_token: "",
				username: username,
				password: password,
			}),
			method: "POST"
		}).then(({data}) => {
			callback("Bearer "+data.response.access_token);
		});
	}
} 