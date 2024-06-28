let MATES = [];

let selectedOrderContent = null;
let selectedOrderShares = [];
let individualShares = {
}
let selectedOrderTotal = [];
let unEvenShares = [];
let orderInfo = '';
let credit = 0.0
let gapiInited = false;
let gisInited = false;
let tokenClient;

let N = 0;
let ACCESS_TOKEN = '';
const CLIENT_ID = '812777760600-3h0hirjcekipu8apc5oue06jk54b1fh1.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAQ9-LBIQurVJFn-9UawHFeCbz9YZ9QB2s';
const SHEETS_SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const DRIVE_SCOPES = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.meet.readonly https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.photos.readonly https://www.googleapis.com/auth/drive.readonly";
// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const BASE_SHEETS_URL = 'https://sheets.googleapis.com/';
const BASE_DRIVE_URL = 'https://www.googleapis.com/drive/';


/* init page */

window.onload = () => {
    //initPage();
    if (sessionStorage.getItem('access_token')) {
        document.getElementById('main_app').classList.remove('d-none');
        document.getElementById('google_signin').classList.add('d-none');
    }
}

/* ============================ Google auth ========================== */

function gapiLoaded() {
    console.log('gapi loaded');
    gapi.load('client', initializeGapiClient);
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: DRIVE_SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    console.log('gis loaded');
    //enableButtons();
    if (gapiInited && gisInited) {
        document.getElementById('google_signin').removeAttribute('disabled');
    }
}

async function initializeGapiClient() {
    //gapi.client.setApiKey(API_KEY);
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    //await gapi.client.load('drive', 'v3', () => {
        //listFiles();
    //})
    gapiInited = true;
    if (gapiInited && gisInited) {
        document.getElementById('google_signin').removeAttribute('disabled');
    }
    //enableButtons();
}

function enableButtons() {
    document.getElementById('file_upload').classList.remove('disabled');
    document.getElementById('add_ppl_btn').removeAttribute('disabled')
    document.getElementById('file_upload').querySelector('input').removeAttribute('disabled');
}

function loadClient() {
    gapi.client.setApiKey(API_KEY);
    return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/drive/v3/rest")
        .then(function() { console.log("GAPI client loaded for API"); },
              function(err) { console.error("Error loading GAPI client for API", err); })
        .then(() => { listFiles(); })
}

function oauthSignIn() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        //console.log('resp', resp);
        sessionStorage.setItem('access_token', resp.access_token);
        setTimeout(() => {
            sessionStorage.clear();
            oauthSignIn();
        }, 3600000);
        //document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('user_authentication').classList.add('d-none');
        document.getElementById('main_app').classList.remove('d-none');
        enableButtons();
        await listFiles();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({prompt: ''});
    }
}

/* ==================== Drive Api Handler ========================= */

async function listFiles() {
    try {
        var res = await gapi.client.drive.files.list({
            q: "name=\"exp-report-jun-2024\""
        });
    } catch(err) {
        console.log(err);
        return;
    }
    const files = res.result.files;
    console.log('drive api response', res);
}


/* ==================== Split Handler ========================== */ 

function initPage() {
    var ppls = localStorage.getItem("instacart-ppl");
    if (ppls != "" && ppls != null) {
        MATES = ppls.split(",");
        var tableEl = document.querySelector('#people_share_table tbody');
        MATES.forEach(mate => {
            var rowEl = document.createElement('tr');
            var cellEll = document.createElement('td');
            cellEll.classList.add('icart-table__td');
            cellEll.innerText = mate;
            rowEl.appendChild(cellEll);
            tableEl.appendChild(rowEl);
            individualShares[mate] = 0.0;
        });
        N = MATES.length;
    }
}

function refresh() {
    document.getElementById('file').value = "";
    selectedOrderTotal = [];
    unEvenShares = [];
    orderInfo = '';
    MATES.forEach(mate => {
        individualShares[mate] = 0.0;
    })
    selectedOrderContent = null;
    selectedOrderShares = [];
    credit = 0.0;
    document.getElementById('order_summary').classList.add('d-none');
    document.getElementById('upload_form').classList.remove('d-none');
    document.getElementById('people_share').classList.remove('d-none');
    let tableBody = document.getElementById('order_total').querySelector('tbody');
    if (tableBody) {
        tableBody.remove();
    }

    tableBody = document.getElementById('share_summary').querySelector('tbody');
    if (tableBody) {
        tableBody.remove();
    }

    var tableHead = document.getElementById('share_table').querySelector('thead'); 
    if (tableHead) {
        tableHead.remove();
    }

    tableBody = document.getElementById('uneven_shares').querySelector('tbody');
    if (tableBody) {
        tableBody.remove();
    }
}

function addPeople(event) {
    var inp_el = document.getElementById('people_input');
    var inp_val = inp_el.value;
    if (inp_val != null && inp_val != "") {
        var ppls = localStorage.getItem("instacart-ppl");
        if (ppls === "" || ppls === null) {
            ppls = inp_val.toLowerCase();
        } else {
            ppls = `${ppls},${inp_val.toLowerCase()}`
        }
        localStorage.setItem("instacart-ppl", ppls);
        location.reload();
    } else {
        alert("input field empty!")
    }
}

function readFile(event) {
    var ppl_share = localStorage.getItem("instacart-ppl");
    if (ppl_share === "" || ppl_share === null) {
        alert('add people for share');
    }
    else {
        const f = event.target.files[0];
        if (f) {
            const r = new FileReader();
            r.onload = function (e) {
                const contents = e.target.result;
                document.getElementById('order_summary').classList.remove('d-none');
                document.getElementById('upload_form').classList.add('d-none');
                document.getElementById('people_share').classList.add('d-none');
                readOrder(contents);
            }
            r.readAsText(f);
        } else {
            alert("Failed to load file");
        }
    }
}

function readOrder(htmlContent) {
    const parser = new DOMParser();
    const html = parser.parseFromString(htmlContent, 'text/html');
    const itemMain = html.querySelector('main');
    let itemDivs = Array.from(itemMain.querySelectorAll('table[class="items delivered"] td[class="order-item"] div[class="item-block"] div[class*="item-delivered"]'));
    //console.log('item divs', itemDivs)
    selectedOrderContent = itemDivs;
    itemDivs = Array.from(itemMain.querySelectorAll('table[class="items adjustments"] td[class="order-item"] div[class="item-block"] div[class*="item-delivered"]'));
    selectedOrderContent = selectedOrderContent.concat(itemDivs);

    const itemTotals = Array.from(itemMain.querySelector('div.totals-container').querySelectorAll('table > tbody > tr'));

    orderInfo = itemMain.querySelector('div.DriverDeliverySchedule').innerText;
    document.getElementById('order_info').innerText = `Order Info: ${orderInfo}`;

    selectedOrderTotal = [];
    for(let i = 0; i < itemTotals.length; i++) {
        selectedOrderTotal.push({
            type: itemTotals[i].childNodes[1].innerText,
            priceStr: itemTotals[i].childNodes[3].innerText,
            price: parseFloat(itemTotals[i].childNodes[3].innerText.replace('$', ''))
        });
    }

    chargeDivs = Array.from(itemMain.querySelectorAll('div.totals-container h2'))
    chargeTexts = chargeDivs.map(d => d.innerText)
    for (let i = 0; i< chargeTexts.length; i++) {
        if (chargeTexts[i].includes('Instacart credits')) {
            chargeDivs = Array.from(itemMain.querySelectorAll('div.totals-container table[class="charges"]'))
            creditInfo = chargeDivs[i].innerText.replace('\n', '').replace(/\s/g, "")
            fi = creditInfo.indexOf('Totalcharged')
            //console.log(creditInfo.substr(fi+13), creditInfo.substr(fi+13).replace("$", "").length)
            credit = parseFloat(creditInfo.substr(fi+13))
        }
    }
    populateOrderTable();
    populateOrderTotal();
}

function populateOrderTable() {
    let tableHead = document.getElementById('share_table').querySelector('thead');
    if (tableHead) {
        tableHead.remove();
    } else {
        tableHead = document.createElement('thead');
    }
    var tableR = document.createElement('tr');
    var thEl = document.createElement('th');
    thEl.classList.add('icart-table__th');
    thEl.setAttribute('style', 'width: 40%;');
    thEl.innerText = 'Item Name';
    tableR.appendChild(thEl);
    thEl = document.createElement('th');
    thEl.classList.add('icart-table__th');
    thEl.innerText = 'Item Price';
    tableR.appendChild(thEl);

    MATES.forEach(mate => {
        var thEl = document.createElement('th');
        thEl.classList.add('icart-table__th');
        thEl.innerText = mate.charAt(0).toUpperCase() + mate.substring(1);
        tableR.appendChild(thEl);
    })
    tableHead.appendChild(tableR);
    document.getElementById('share_table').appendChild(tableHead);


    let tableBody = document.getElementById('share_table').querySelector('tbody');
    if (tableBody) {
        tableBody.remove();
    }
    tableBody = document.createElement('tbody');
    selectedOrderContent.forEach((orderRow, i) => {
        const oEls = orderRow.childNodes;
        //const pImgEl = oEls[1];
        const pEls = oEls[3].childNodes;
        let pPriceEl = null;
        if (oEls[5].childNodes.length > 3) {
            pPriceEl = oEls[5].childNodes[6];
        }
        else {
            pPriceEl = oEls[5].childNodes[2];
        }
        //const pPriceEl = oEls[5].childNodes[2];
        if (pPriceEl.innerText.includes("Final item price")) {
            fi = pPriceEl.innerText.indexOf("Final item price");
            di = pPriceEl.innerText.substr(fi).indexOf("$");
            priceStr = pPriceEl.innerText.substr(fi + 17)
            priceVal = parseFloat(priceStr.replace("$", ""))
        }
        else {
            priceStr = pPriceEl.innerText;
            priceVal = parseFloat(priceStr.replace("$", ""))
        }
        //const priceStr = pPriceEl.querySelector('div').innerText;
        //const priceVal = parseFloat(priceStr.replace('$', ''));
        const pName = pEls[0].data.replace('\n', '')
        //console.log(pName, priceStr, imgEl);

        selectedOrderShares.push({
            itemName: pName,
            price: priceVal,
        });
        var orderShareLast = selectedOrderShares.length - 1;

        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.classList.add('icart-table__td');
        td.innerText = pName;
        tr.appendChild(td);
        td = document.createElement('td')
        td.classList.add('icart-table__td');
        td.innerText = priceStr;
        tr.appendChild(td);

        MATES.forEach(mate => {
            td = document.createElement('td')
            td.classList.add('icart-table__td');
            let chkbox = document.createElement('input');
            chkbox.setAttribute('type', 'checkbox');
            chkbox.setAttribute('onchange', "setCheckboxValue(event)");
            chkbox.setAttribute('id', `${mate}_${i}`);
            td.appendChild(chkbox);
            tr.appendChild(td);
            selectedOrderShares[orderShareLast][mate] = false;
        })
        
        tableBody.appendChild(tr);

        
    })
    document.getElementById('share_table').appendChild(tableBody);
}

function populateOrderTotal() {
    let tableBody = document.getElementById('order_total').querySelector('tbody');
    if (tableBody) {
        tableBody.remove();
    }
    tableBody = document.createElement('tbody');
    selectedOrderTotal.forEach((os, i) => {
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.classList.add('icart-table__td');
        td.classList.add('text-r');
        td.innerText = os.type;
        tr.appendChild(td);
        td = document.createElement('td');
        td.classList.add('icart-table__td');
        td.classList.add('text-r');
        td.innerText = os.priceStr;
        tr.appendChild(td);
        tableBody.appendChild(tr);
    })
    const fullTotal = selectedOrderTotal.filter(x => x.type === "Total")[0]
    tr = document.createElement('tr');
    td = document.createElement('td');
    td.classList.add('icart-table__td');
    td.classList.add('text-capitalize');
    td.classList.add('font-c-red');
    td.classList.add('text-r');
    td.innerText = 'Instacart credit applied';
    tr.appendChild(td);
    td = document.createElement('td');
    td.classList.add('icart-table__td');
    td.classList.add('font-c-red')
    td.classList.add('text-r');
    td.innerText = credit;
    tr.appendChild(td);
    tableBody.appendChild(tr);

    tr = document.createElement('tr');
    td = document.createElement('td');
    td.classList.add('icart-table__td');
    td.classList.add('text-capitalize');
    td.classList.add('fw-bold');
    td.classList.add('text-r');
    td.innerText = 'Total charges applied';
    tr.appendChild(td);
    td = document.createElement('td');
    td.classList.add('icart-table__td');
    td.classList.add('fw-bold')
    td.classList.add('text-r');
    td.innerText = fullTotal.price - credit;
    tr.appendChild(td);
    tableBody.appendChild(tr);    
    
    document.getElementById('order_total').appendChild(tableBody);
}

function setCheckboxValue(event) {
    const id = event.target.id;
    const val = event.target.checked;
    const idx = parseInt(id.split('_')[1], 10)
    const prn = id.split('_')[0]
    selectedOrderShares[idx][prn] = val;
}

function calculateShares() {
    MATES.forEach(mate => {
        individualShares[mate] = 0.0;
    })
    unEvenShares = [];

    selectedOrderShares.forEach(prod => {
        let nos = 0;

        MATES.forEach(mate => {
            if (prod[mate]) {
                nos += 1;
            }
        });


        if (nos > 0) {
            const pricePerShare = prod.price / nos;
            MATES.forEach(mate => {
                if (prod[mate]) {
                    individualShares[mate] += pricePerShare;
                }
            })
        }
        else {
            unEvenShares.push(prod);
        }
    })
    const itemTotals = selectedOrderTotal.filter(x => (x.type === 'Checkout Bag Fee' || x.type === 'Checkout Bag Fee Tax' || x.type === 'Sales Tax' || x.type === 'Service Fee')).map(x => x.price)
    //const existingCredit = 
    const miscCharges = itemTotals.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

    let tableBody = document.getElementById('share_summary').querySelector('tbody');
    if (tableBody) {
        tableBody.remove();
    }

    tableBody = document.createElement('tbody');
    Object.keys(individualShares).forEach(x => {
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.classList.add('icart-table__td');
        td.classList.add('text-capitalize');
        td.innerText = `${x}'s Share`;
        tr.appendChild(td);
        td = document.createElement('td');
        td.classList.add('icart-table__td');
        td.classList.add('text-capitalize');
        td.innerText = individualShares[x] + (miscCharges/N) - (credit/N);
        tr.appendChild(td);
        tableBody.appendChild(tr);
    })
    document.getElementById('share_summary').appendChild(tableBody);

    tableBody = document.getElementById('uneven_shares').querySelector('tbody');
    if (tableBody) {
        tableBody.remove();
    }

    tableBody = document.createElement('tbody');
    unEvenShares.forEach(row => {
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.classList.add('icart-table__td');
        td.classList.add('text-capitalize');
        td.innerText = row.itemName;
        tr.appendChild(td);
        td = document.createElement('td');
        td.classList.add('icart-table__td');
        td.innerText = row.price;
        tr.appendChild(td);
        tableBody.appendChild(tr);
    })
    
    document.getElementById('uneven_shares').appendChild(tableBody);
}


