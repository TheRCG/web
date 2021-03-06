$(document).ready(function() {
	$('.menu').sticky();

	queryCryptsyData();
	queryNews();
	queryCurrentNetworkHashRate();
	queryChartData(10, 4640);
	queryTotalMinedCoins();
	queryBPIData();
});


/**
 * CRYPTSY MARKET DATA
 **/
function queryCryptsyData() {
	$.ajax({
		type: 'GET',
		url: 'pubapi2.cryptsy.com/api.php?method=singlemarketdata&marketid=12',
		dataType: 'jsonp',
		success: function(result) {
			if (result.success == 1 && result.return ) {
				var rate = parseFloat(result.return.markets.ELC.lasttradeprice) * 1000;
				if (typeof rate != 'undefined') {
					rate = Math.round(rate * 100) / 100;
					window.rate = rate;
					putCoinMarketCap();
					var t = $('*[data-purpose=cryptsi-elc-mbtc]');
					t.text(rate);
				}

				var volume = parseFloat(result.return.markets.ELC.volume);
				if (typeof volume != 'undefined') {
					var t = $('*[data-purpose=cryptsi-elc-volume]');
					t.text(volume.toFixed(2));
				}

				var time = result.return.markets.ELC.lasttradetime + " EST";
				if (typeof volume != 'undefined') {
					var t = $('*[data-purpose=cryptsi-elc-tradetime]');
					t.text(moment(time).fromNow());
				}
			} else {
				setTimeout(queryCryptsyData, 5000);
			}
		},
		error: function() {
			setTimeout(queryCryptsyData, 5000);
		}
	});
};

function queryBPIData() {
	$.ajax({
		type: 'GET',
		url: 'https://www.bitstamp.net/api/ticker/',
		dataType: 'jsonp',
		success: function(result) {
			window.lastBTC = parseFloat(result.last);
			putCoinMarketCap();
		},
		error: function() {
			setTimeout(queryCryptsyData, 5000);
		}
	});
};



/**
 * BLOCKCHAIN DATA
 **/
function queryCurrentNetworkHashRate(e) {
	$.ajax({
		type: 'GET',
		url: 'http://elc.webboise.com/chain/elacoin/q/nethash/1/-10?format=jsonp',
		contentType: 'application/jsonp',
		dataType: "jsonp",
		jsonp: 'jsonp',
		success: onNetHash,
		error: function(xhr, status, err) {
			setTimeout(queryNetworkHashRate, 5000);
		}
	});
};

function queryTotalMinedCoins(e) {
	$.ajax({
		type: 'GET',
		url: 'http://elc.webboise.com/chain/Elacoin/q/totalbc?format=jsonp',
		contentType: 'application/jsonp',
		dataType: "jsonp",
		jsonp: 'jsonp',
		success: function(e) {
			window.totalCoins = parseFloat(e[0]);
			putCoinMarketCap();
		},
		error: function(xhr, status, err) {
			setTimeout(queryTotalMinedCoins, 5000);
		}
	});

}

function onNetHash(result) {
	var totalRates = 0;
	var c = result.length - 1,
		l = result.length,
		p = result[c],
		totalTime = p[1] - result[0][1],
		averageTime = totalTime / result.length,
		rate = p[5] / averageTime;

	var lMhPerSec = rate / 1000000;
	$('*[data-purpose="network-hash-rate"]').html(lMhPerSec.toFixed(2));
	$('*[data-purpose="network-difficulty"]').html(p[4].toFixed(2));
	$('*[data-purpose="network-lastblock-i"]').html(p[0]);
	$('*[data-purpose="network-lastblock-ago"]').html(moment(p[1] * 1000).fromNow());

	var reward = p[4] | 0;
	reward /= (194400 + p[0]);
	reward *= 194400;
	$('*[data-purpose="network-reward"]').html(reward.toFixed(2));
};

function putCoinMarketCap(e) {
	if ( window.totalCoins && window.lastBTC && window.rate ) {
		var cap = window.rate/1000 * window.lastBTC * window.totalCoins;
		$('*[data-purpose=usd-market-cap]').text(cap.toFixed(2));
	}
}

function queryChartData(interval, blocks) {
	window.interval = interval;
	$.ajax({
		type: 'GET',
		url: 'http://elc.webboise.com/chain/elacoin/q/nethash/' + interval + '/-' + blocks + '?format=jsonp',
		contentType: 'application/jsonp',
		dataType: "jsonp",
		jsonp: 'jsonp',
		success: onChartData,
		error: function(xhr, status, err) {
			setTimeout(function() {
				queryChartData(interval, blocks);
			}, 5000);
		}
	});
};

function switchChartTimeframe(e, i, b) {
	var g = $(e).closest('.btn-group');
	g.find('.active').removeClass('active');
	$(e).addClass('active');
	$(e).find('.fa').show();
	queryChartData(i, b);
}

function onChartData(result) {
	$('.btn-group .fa').hide();

	var rates = [],
		diff = [],
		times = [];
	var c, l, p, lp, rate, date, timePerBlock;
	for (c = 1, l = result.length; c < l; c++) {
		p = result[c], lp = result[c - 1];
		date = p[1] * 1000;
		timePerBlock = (p[1] - lp[1]) / window.interval;

		rate = p[5] / timePerBlock / 1000000;
		rates.push([date, rate]);
		diff.push([date, p[4]]);
		times.push([date, timePerBlock / 60]);
	}

	drawGraph('#graph1', 'Mh/s', rates);
	drawGraph('#graph2', 'Difficulty', diff);
	drawGraph('#graph3', 'Time / block (min)', times);
};


function drawGraph(id, title, data) {
	$(id).highcharts({
		chart: {
			zoomType: 'x',
			spacingRight: 20,
			spacingTop: 30,
			backgroundColor: 'rgba(255,255,255,0.5)'
		},
		title: {
			text: ''
		},
		xAxis: {
			type: 'datetime',
			maxZoom: 381.6,
			title: {
				text: null
			}
		},
		credits: {
			enabled: false
		},
		yAxis: {
			title: {
				text: title
			},
			min: 0
		},
		tooltip: {
			shared: true
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			area: {
				fillColor: {
					linearGradient: {
						x1: 0,
						y1: 0,
						x2: 0,
						y2: 1
					},
					stops: [
						[0, Highcharts.getOptions().colors[0]],
						[1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
					]
				},
				lineWidth: 1,
				marker: {
					enabled: false
				},
				shadow: false,
				states: {
					hover: {
						lineWidth: 1
					}
				},
				threshold: null
			}
		},
		series: [{
			type: 'area',
			name: title,
			data: data
		}]
	});
}


/**
 * NEWS FROM WP.COM
 **/
function queryNews(e) {
	var container = $('*[data-purpose="news-box"]'),
		hotContainer = $('*[data-purpose="hot-news-container"]');
	container.html('<div class="text-center" style="font-size: 26px; color: #999;"><br/>loading news <br/><br/><i class="fa fa-2x fa-spin fa-spinner"></i></br></div>');


	$.getJSON(
		'http://public-api.wordpress.com/rest/v1/sites/elacoinblog.wordpress.com/posts/?number=10&callback=?'
	).done(function(response) {
		container.html('');
		hotContainer.html('');
		var c, l, ps = response.posts,
			p, t, ht, chc, isHot, tag;
		for (c = 0, l = ps.length; c < l; c++) {
			p = ps[c];
			t = $('<div class="news-box"><div class="left text-center"><small>' + moment(p.date).format('DD MMM YY') + '</small><br/><i class="fa fa-2x fa-chevron-down"></i></div><div class="right"><h3>' + p.title + '</h3><div class="news-content" style="display: none;">' + p.content + '</div></div></div>');
			t.on('click', toggleNews);
			container.append(t);

			isHot = false;
			for (tag in p.tags) {
				if (tag.toLowerCase().indexOf('hot') >= 0) {
					isHot = true;
					break;
				}
			}

			chc = hotContainer.html();
			if (isHot && c < 3) {
				ht = $('<a href="#about">' + p.title + '</a>')
				ht.click(smoothScroll);
				hotContainer.append(chc == '' ? '' : ' | ');
				hotContainer.append(ht);
			}
		}
	}).fail(function(e) {
		setTimeout(queryNews, 5000);
	});
};

function toggleNews(e) {
	var $this = $(this),
		cd = $this.find('.fa-chevron-down'),
		cu = $this.find('.fa-chevron-up');
	if (cd.length) {
		cd.removeClass('fa-chevron-down').addClass('fa-chevron-up');
		$this.find('.news-content').slideDown(200);
	} else if (cu.length) {
		cu.addClass('fa-chevron-down').removeClass('fa-chevron-up');
		$this.find('.news-content').slideUp(200);
	}
};
