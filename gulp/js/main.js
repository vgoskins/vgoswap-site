let tf2SellPrice = 1.50;
let vgoSellPrice = 2.30;
let tf2BuyPrice = 1.59;
let vgoBuyPrice = 2.39;

let pageLoaderHTML = `
<div class="preloader-wrapper active pageLoadPreloader">
	<div class="spinner-layer spinner-red-only">
		<div class="circle-clipper left">
			<div class="circle"></div>
		</div><div class="gap-patch">
			<div class="circle"></div>
		</div><div class="circle-clipper right">
			<div class="circle"></div>
		</div>
	</div>
</div>
`;

function getModal(title, custom) {
	if (!custom) {
		custom = '';
	}
	let modal = `
	<div class="modal">
		<div class="modal-content">
			<h4>${title}</h4>
			<div class="modalBody">
				<div class="modalLoader center-align">
					${pageLoaderHTML}
				</div>
				<div class="modalFeedback center-align"><h5>${custom}</h5></div>
			</div>
		</div>
	</div>
	`;
	return modal;
}

function openChat() {
	localStorage.chatOpen = 'true';
	$('#chat').show();
	$('#chat').css('height', '60%');
	setTimeout(function() {
		$('.chatContain').animate({
			scrollTop: $('.chatContain').prop('scrollHeight')
		}, 200);
	}, 300);
}

function closeChat() {
	localStorage.chatOpen = 'false';
	$('#chat').css('height', '0');
	$('#chat').fadeOut(300);
}

function goHomeRoute() {
	document.title = 'VGOSwap - Trade TF2 & VGO Keys Instantly!';
	window.history.pushState({"title": 'VGOSwap - Trade TF2 & VGO Keys Instantly!'},"", '/');
	return true;
}

function pushState(title, route) {
	document.title = `${title} - VGOSwap`;
	window.history.pushState({"title": `${title} - VGOSwap`},"", `/${route}`);
	return true;
}

function replaceState(title, route) {
	document.title = `${title} - VGOSwap`;
	window.history.replaceState({"title": `${title} - VGOSwap`},"", `/${route}`);
	return true;
}

let homeModal = {
	onCloseStart: goHomeRoute
}

function doPopThing() {
	let pathArr = window.location.pathname.split('/');
	if (pathArr[1]) {
		if (pathArr[1] == 'faq') {
			if (localStorage.language == 'zh') {
				$('#rootModal').html(getModal('常见问题'));
			} else {
				$('#rootModal').html(getModal('FAQ'));
			}
		} else if (pathArr[1] == 'contact') {
			if (localStorage.language == 'zh') {
				$('#rootModal').html(getModal('联系'));
			} else {
				$('#rootModal').html(getModal('Contact'));
			}
			
		} else if (pathArr[1] == 'privacy') {
			if (localStorage.language == 'zh') {
				$('#rootModal').html(getModal('隐私政策'));
			} else {
				$('#rootModal').html(getModal('Privacy'));
			}
			
		} else if (pathArr[1] == 'terms') {
			if (localStorage.language == 'zh') {
				$('#rootModal').html(getModal('服务条款'));
			} else {
				$('#rootModal').html(getModal('Terms'));
			}
			
		} else if (pathArr[1] == 'settings') {
			if (localStorage.language == 'zh') {
				$('#rootModal').html(getModal('Settings'));
			} else {
				$('#rootModal').html(getModal('Settings'));
			}
			
		}
		$('.modal').modal(homeModal);
		$('.modal').modal('open');
		socket.emit('renderPage', pathArr[1], 'renderModalBody');
	}
}
function getUrlVars() {
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function updateLanguage(lang) {
	localStorage.language = lang;
	if (lang == 'zh') {
		$('.en').hide();
		$('.zh-btn-contain').hide();
		$('.en-btn-contain').show();
		$('.zh').show();
	} else if (lang == 'en') {
		$('.zh').hide();
		$('.en-btn-contain').hide();
		$('.zh-btn-contain').show();
		$('.en').show();
	}
}

$(document).on('click', '.zh-btn', function() {
	updateLanguage('zh');
});

$(document).on('click', '.en-btn', function() {
	updateLanguage('en');
});

$(document).ready(function () {
	setTimeout(function() {
		$('#loader').fadeOut('slow');
	}, 500);
	if (!localStorage.chatOpen) {
		localStorage.chatOpen = 'true';
	}
	if (localStorage.chatOpen == 'true') {
		openChat();
	}
	if (!localStorage.language) {
		localStorage.language = 'en';
	}
	if (getUrlVars()['l'] == 'zh') {
		localStorage.language = 'zh';
	} else if (getUrlVars()['l'] == 'en') {
		localStorage.language = 'en';
	}
	
	
	$('.modal').modal();
	M.updateTextFields();
	socket.emit('getBalance');
	socket.emit('getChat');
	$('time.timeago').timeago();
	$('.tooltipped').tooltip();
	$('.dropdown-trigger').dropdown();
	let pathArr = window.location.pathname.split('/');
	if (pathArr[1] == 'faq') {
		replaceState('FAQ', 'faq');
	} else if (pathArr[1] == 'contact') {
		replaceState('Contact', 'contact');
	} else if (pathArr[1] == 'privacy') {
		replaceState('Privacy', 'privacy');
	} else if (pathArr[1] == 'terms') {
		replaceState('Terms', 'terms');
	} else if (pathArr[1] == 'settings') {
		replaceState('Settings', 'settings');
	}
	doPopThing();
	updateLanguage(localStorage.language);
});

$(document).on('keydown', '#chatInput', function(e) {
	if (e.keyCode == 13) {
		socket.emit('chatMsg', $('#chatInput').val());
		$('#chatInput').val('');
	}
});

function getDev(steamid) {
	let devHTML = '';
	if (steamid == '76561198089553444') {
		devHTML = `<span class="devText">A</span>`;
	}
	return devHTML;
}

socket.on('chatMsg', function(data) {
	let html = `
		<div class="chatMessage z-depth-1">
			<a class="chatUserLink" href="https://steamcommunity.com/profiles/${data.steamid}" target="_blank">
				<img src="${data.avatar}" class="chatAvatar avatar left">
				<div class="chatName truncate" title="${data.name}">${getDev(data.steamid)} ${data.name}</div>
			</a>
			<div class="divider chatDivider"></div>
			<div class="chatMsg">${data.msg}</div>
			<div class="chatTime right-align"><time class="timeago" datetime="${data.time}"></time></div>
		</div>
	`;
	$(html).hide().appendTo($('.chatContain')).fadeIn();
	$('.chatContain').animate({
		scrollTop: $('.chatContain').prop('scrollHeight')
	}, 200);
	$('time.timeago').timeago();
});

socket.on('loadedChat', function(messages) {
	$('.chatContain').text('');
	messages.forEach(function(msg) {
		let html = `
			<div class="chatMessage z-depth-1">
				<a class="chatUserLink" href="https://steamcommunity.com/profiles/${msg.steamid}" target="_blank">
					<img src="${msg.avatar}" class="chatAvatar avatar left">
					<div class="chatName truncate" title="${msg.personaname}">${getDev(msg.steamid)} ${msg.personaname}</div>
				</a>
				<div class="divider chatDivider"></div>
				<div class="chatMsg">${msg.msg}</div>
				<div class="chatTime right-align"><time class="timeago" datetime="${msg.time}"></time></div>
			</div>
		`;
		$(html).hide().appendTo($('.chatContain')).fadeIn();
	});
	$('time.timeago').timeago();
	$('.chatContain').animate({
		scrollTop: $('.chatContain').prop('scrollHeight')
	}, 200);
});

socket.on('alert', message => {
	M.toast({html: message});
});

$(document).on('click', '#tf2SellBtn', function() {
	socket.emit('tf2Sell', $('#tf2SellAmount').val());
	$('#rootModal').html(getModal('Sell TF2 Keys', 'Checking inventory...', `<h5 class="modalFeedback center-align">Verifying trade...</h5>`));
	$('.modal').modal();
	$('.modal').modal('open');
});

$(document).on('click', '#vgoSellBtn', function() {
	socket.emit('vgoSell', $('#vgoSellAmount').val());
	$('#rootModal').html(getModal('Sell VGO Keys', 'Checking inventory...', `<h5 class="modalFeedback center-align">Verifying trade...</h5>`));
	$('.modal').modal();
	$('.modal').modal('open');
});

$(document).on('click', '#tf2BuyBtn', function() {
	socket.emit('tf2Buy', $('#tf2BuyAmount').val());
	$('#rootModal').html(getModal('Buy TF2 Keys', 'Verifying trade...', `<h5 class="modalFeedback center-align">Verifying trade...</h5>`));
	$('.modal').modal();
	$('.modal').modal('open');
});

$(document).on('click', '#vgoBuyBtn', function() {
	socket.emit('vgoBuy', $('#vgoBuyAmount').val());
	$('#rootModal').html(getModal('Buy VGO Keys', 'Verifying trade...', `<h5 class="modalFeedback center-align">Verifying trade...</h5>`));
	$('.modal').modal();
	$('.modal').modal('open');
});

socket.on('updateBalance', function(balance) {
	console.log(balance)
	$('.balance').text(balance.toFixed(2));
});

socket.on('changeModalStatus', function(message) {
	$('.modalFeedback').html(`<h5>${message}</h5>`);
});

socket.on('modalErrorFeedback', function(message) {
	$('.modalLoader').html(`<i class="far fa-times-circle modalFeedbackIcon"></i>`);
	$('.modalFeedback').html(`<h5>${message}</h5>`)
});

socket.on('modalSuccessFeedback', function(message) {
	$('.modalLoader').html(`<i class="material-icons modalFeedbackIcon">check_circle_outline</i>`);
	$('.modalFeedback').html(message);
});

socket.on('updateStock', function(data) {
	$('.tf2KeysInStock').text(data.tf2KeysInStock);
	$('.vgoKeysInStock').text(data.vgoKeysInStock);
});

$(document).on('click', '#mainScrollBtn', function() {
	$([document.documentElement, document.body]).animate({
		scrollTop: $("#mainTrade").offset().top - 75
	}, 500);
});

socket.on('modalEnterTradeURL', function() {
	$('.modalFeedback').removeClass('center-align');
	$('.modalLoader').text('');
	$('.modalFeedback').html(`
		<h5 class="center-align">Set your Steam Trade URL to trade!</h5>
		<div class="row">
			<div class="input-field col l6 m6 s12 offset-l3 offset-m3">
				<input placeholder="Trade URL" id="steamTradeUrlInput" type="text" class="validate">
				<label for="steamTradeUrlInput">Trade URL</label>
        <span class="helper-text"><a href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url" target="_blank">Get your Trade URL</a></span>
			</div>
			<div class="col l6 m6 s12 offset-l3 offset-m3">
				<a class="btn blue accent-2 setTradeUrl">Update Trade URL</a>
			</div>
		</div>
	`);
	M.updateTextFields();
});

$(document).on('click', '.setTradeUrl', function() {
	socket.emit('updateTradeUrl', $('#steamTradeUrlInput').val());
});

socket.on('tradeUrlSuccess', function() {
	$('.modal').modal('close');
});

$(document).on('click', '#openOpskinsWithdraw', function() {
	$('#rootModal').html(getModal('Buy OPSkins Funds'));
	$('.modal').modal();
	$('.modal').modal('open');
	socket.emit('renderPage', 'opskins', 'renderModalBody');
});

socket.on('renderModalBody', function(html) {
	$('.modalBody').html(html);
	M.updateTextFields();
	$('.collapsible').collapsible();
	$('#opskinsAmountInput').val($('.balance').text());
	updateLanguage(localStorage.language);
});

$(document).on('click', '#opskinsWithdraw', function() {
	socket.emit('opskinsWithdraw', $('#opskinsAmountInput').val());
	$('.modalBody').html(`
<div class="modalLoader center-align">
	${pageLoaderHTML}
</div>
<div class="modalFeedback center-align"><h5>Verifying user...</h5></div>
`
);
});

$(document).on('click', '.contact', function() {
	pushState('Contact', 'contact');
	if (localStorage.language == 'zh') {
		$('#rootModal').html(getModal('联系'));
	} else {
		$('#rootModal').html(getModal('Contact'));
	}
	
	$('.modal').modal(homeModal);
	$('.modal').modal('open');
	socket.emit('renderPage', 'contact', 'renderModalBody');
});

$(document).on('click', '.faq', function() {
	pushState('FAQ', 'faq');
	if (localStorage.language == 'zh') {
		$('#rootModal').html(getModal('常见问题'));
	} else {
		$('#rootModal').html(getModal('FAQ'));
	}
	
	$('.modal').modal(homeModal);
	$('.modal').modal('open');
	socket.emit('renderPage', 'faq', 'renderModalBody');
});

$(document).on('click', '.terms', function() {
	pushState('Terms', 'terms');
	if (localStorage.language == 'zh') {
		$('#rootModal').html(getModal('服务条款'));
	} else {
		$('#rootModal').html(getModal('Terms'));
	}
	
	$('.modal').modal(homeModal);
	$('.modal').modal('open');
	socket.emit('renderPage', 'terms', 'renderModalBody');
});

$(document).on('click', '.privacy', function() {
	pushState('Privacy', 'privacy');
	if (localStorage.language == 'zh') {
		$('#rootModal').html(getModal('隐私政策'));
	} else {
		$('#rootModal').html(getModal('Privacy'));
	}
	
	$('.modal').modal(homeModal);
	$('.modal').modal('open');
	socket.emit('renderPage', 'privacy', 'renderModalBody');
});

$(document).on('click', '.settings', function() {
	pushState('Settings', 'settings');
	if (localStorage.language == 'zh') {
		$('#rootModal').html(getModal('Settings'));
	} else {
		$('#rootModal').html(getModal('Settings'));
	}
	
	$('.modal').modal(homeModal);
	$('.modal').modal('open');
	socket.emit('renderSettings');
});

window.onpopstate = function(e){
	document.title = e.state.title;
	$('.modal').modal('close');
	doPopThing();
}

socket.on('renderSettings', function(html) {
	$('.modalBody').html(html);
	M.updateTextFields();
});

//let elems = document.querySelectorAll('.modal');
//let instances = M.Modal.init(elems, {
//	onCloseStart: function
//});

$(document).on('click', '.setOpskinsSteamid', function() {
	socket.emit('updateCustom', $('#opskinsSteamidInput').val());
});

socket.on('closeModal', function() {
	$('.modal').modal('close');
});

socket.on('updateOnline', function(online) {
	$('.online').text(online);
});

$(document).on('click', '.modalSettingsNav', function() {
	$('#rootSettingsModal').html(pageLoaderHTML);
	socket.emit('loadSettingsNav', $(this).attr('data-id'));
});

socket.on('loadSettingsNav', function(html) {
	$('#rootSettingsModal').text('');
	$(html).hide().appendTo($('#rootSettingsModal')).fadeIn();
	M.updateTextFields();
});

