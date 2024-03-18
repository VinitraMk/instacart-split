
const MATE1 = 'urja';
const MATE2 = 'vinitra';
const MATE3 = 'srimathi';

const messages = [];
const message_contents = [];
let selectedOrderContent = null;
let selectedOrderShares = [];
let individualShares = {
    [MATE1]: 0.0,
    [MATE2]: 0.0,
    [MATE3]: 0.0 
}
let selectedOrderTotal = [];
let unEvenShares = [];

function readFile(event) {
    const f = event.target.files[0];
    if (f) {
        const r = new FileReader();
        r.onload = function (e) {
            const contents = e.target.result;
            readOrder(contents);
        }
        r.readAsText(f);
    } else {
        alert("Failed to load file");
    }
}

function readOrder(htmlContent) {
    const parser = new DOMParser();
    const html = parser.parseFromString(htmlContent, 'text/html');
    const itemMain = html.querySelector('main');
    let itemDivs = Array.from(itemMain.querySelectorAll('table[class="items delivered"] td[class="order-item"]'));
    const itemTotals = Array.from(itemMain.querySelector('div.totals-container').querySelectorAll('table > tbody > tr'));
    selectedOrderContent = itemDivs.map(d => d.childNodes[1]);
    itemDivs = Array.from(itemMain.querySelectorAll('table[class="items adjustments"] td[class="order-item"]')).map(d => d.childNodes[1]);
    selectedOrderContent = selectedOrderContent.concat(itemDivs);

    selectedOrderTotal = [];
    for(let i = 0; i < itemTotals.length; i++) {
        selectedOrderTotal.push({
            type: itemTotals[i].childNodes[1].innerText,
            priceStr: itemTotals[i].childNodes[3].innerText,
            price: parseFloat(itemTotals[i].childNodes[3].innerText.replace('$', ''))
        });
    }
    populateOrderTable();
    populateOrderTotal();
}

function populateOrderTable() {
    let tableBody = document.getElementById('share_table').querySelector('tbody');
    if (tableBody) {
        tableBody.remove();
    }
    tableBody = document.createElement('tbody');
    selectedOrderContent.forEach((orderRow, i) => {
        const oEls = orderRow.childNodes[1].childNodes;
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
        const priceStr = pPriceEl.querySelector('div').innerText;
        const priceVal = parseFloat(priceStr.replace('$', ''));
        const pName = pEls[0].data.replace('\n', '')
        //console.log(pName, priceStr, imgEl);
        let tr = document.createElement('tr');
        let td = document.createElement('td');
        td.classList.add('icart-table__td');
        td.innerText = pName;
        tr.appendChild(td);
        td = document.createElement('td')
        td.classList.add('icart-table__td');
        td.innerText = priceStr;
        tr.appendChild(td);
        td = document.createElement('td')
        td.classList.add('icart-table__td');
        let chkbox = document.createElement('input');
        chkbox.setAttribute('type', 'checkbox');
        chkbox.setAttribute('onchange', "setCheckboxValue(event)");
        chkbox.setAttribute('id', `${MATE1}_${i}`);
        td.appendChild(chkbox);
        tr.appendChild(td);
        td = document.createElement('td')
        td.classList.add('icart-table__td');
        chkbox = document.createElement('input')
        chkbox.setAttribute('type', 'checkbox');
        chkbox.setAttribute('onchange', "setCheckboxValue(event)");
        chkbox.setAttribute('id', `${MATE2}_${i}`);
        td.appendChild(chkbox);
        tr.appendChild(td);
        td = document.createElement('td')
        td.classList.add('icart-table__td');
        chkbox = document.createElement('input');
        chkbox.setAttribute('type', 'checkbox');
        chkbox.setAttribute('onchange', "setCheckboxValue(event)");
        chkbox.setAttribute('id', `${MATE3}_${i}`);
        td.appendChild(chkbox);
        tr.appendChild(td);
        tableBody.appendChild(tr);

        selectedOrderShares.push({
            itemName: pName,
            price: priceVal,
            [MATE1]: false,
            [MATE2]: false,
            [MATE3]: false
        })
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
    individualShares[MATE1] = 0.0;
    individualShares[MATE2] = 0.0;
    individualShares[MATE3] = 0.0;
    unEvenShares = [];

    selectedOrderShares.forEach(prod => {
        let nos = 0;
        if (prod[MATE1]) {
            nos = nos + 1;
        }
        if (prod[MATE2]) {
            nos = nos + 1;
        }
        if (prod[MATE3]) {
            nos = nos + 1;
        }

        if (nos > 0) {
            const pricePerShare = prod.price / nos;
            if (prod[MATE1]) {
                individualShares[MATE1] += pricePerShare;
            }
            if (prod[MATE2]) {
                individualShares[MATE2] += pricePerShare;
            }
            if (prod[MATE3]) {
                individualShares[MATE3] += pricePerShare;
            }
        }
        else {
            unEvenShares.push(prod);
        }
    })
    const itemTotals = selectedOrderTotal.filter(x => (x.type === 'Checkout Bag Fee' || x.type === 'Checkout Bag Fee Tax' || x.type === 'Sales Tax' || x.type === 'Service Fee')).map(x => x.price)
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
        td.innerText = individualShares[x] + (miscCharges/3);
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
