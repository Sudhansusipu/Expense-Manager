/* ====== Storage ====== */
let expenses = JSON.parse(localStorage.getItem("expenses") || "{}");
let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
let investments = JSON.parse(localStorage.getItem("investments") || "[]");
let credits = JSON.parse(localStorage.getItem("credits") || "[]");

/* Load saved salary/savings */
document.getElementById("salary").value = localStorage.getItem("salary") || "";
document.getElementById("bank").value = localStorage.getItem("bank") || "";

/* ====== Tabs ====== */
const tabs = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
tabs.forEach(tab => tab.addEventListener("click", () => {
  tabs.forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  tabContents.forEach(tc => tc.classList.remove("active"));
  document.getElementById(tab.dataset.tab).classList.add("active");
}));

/* ====== Save Salary ====== */
document.getElementById("save-salary").addEventListener("click", () => {
  localStorage.setItem("salary", document.getElementById("salary").value);
  localStorage.setItem("bank", document.getElementById("bank").value);
  updateTotals();
  alert("Salary & Savings saved!");
});

/* ====== Calendar ====== */
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDate = null;

function pad(n) { return n.toString().padStart(2,"0"); }
function dateKey(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

function generateCalendar(month=currentMonth, year=currentYear) {
  const grid = document.getElementById("calendar-grid");
  grid.innerHTML = "";

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  document.getElementById("month-year").textContent = `${monthNames[month]} ${year}`;

  const days = ["S","M","T","W","T","F","S"];
  days.forEach(d => {
    const head = document.createElement("div");
    head.className = "calendar-cell";
    head.textContent = d;
    grid.appendChild(head);
  });

  const firstDay = new Date(year, month, 1).getDay();
  for (let i=0;i<firstDay;i++) {
    const empty = document.createElement("div");
    empty.className="calendar-cell";
    empty.style.background="transparent";
    grid.appendChild(empty);
  }

  const daysInMonth = new Date(year, month+1, 0).getDate();
  for (let d=1;d<=daysInMonth;d++) {
    const key = `${year}-${pad(month+1)}-${pad(d)}`;
    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    dayDiv.textContent = d;

    if (expenses[key]) {
      const total = dayTotal(expenses[key]);
      if (total < 100) dayDiv.classList.add("low");
      else if (total <= 200) dayDiv.classList.add("medium");
      else dayDiv.classList.add("high");
    }

    dayDiv.addEventListener("click", () => {
      selectedDate = new Date(year, month, d);
      document.getElementById("selected-date").textContent = formatDate(selectedDate);
      document.querySelectorAll(".calendar-day").forEach(el => el.classList.remove("selected"));
      dayDiv.classList.add("selected");
      loadDailyExpense();
    });

    grid.appendChild(dayDiv);
  }
}

document.getElementById("prev-month").addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  generateCalendar(currentMonth,currentYear); updateTotals();
});
document.getElementById("next-month").addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  generateCalendar(currentMonth,currentYear); updateTotals();
});

function formatDate(d) {
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}`;
}

/* ====== Daily Expenses ====== */
function loadDailyExpense() {
  if (!selectedDate) return;
  const key = dateKey(selectedDate);
  const dayExp = expenses[key] || { breakfast:0,lunch:0,snacks:0,dinner:0,other:[] };

  document.getElementById("breakfast").value = dayExp.breakfast;
  document.getElementById("lunch").value = dayExp.lunch;
  document.getElementById("snacks").value = dayExp.snacks;
  document.getElementById("dinner").value = dayExp.dinner;
  renderOtherList(dayExp.other);
  updateTotals();
}

document.getElementById("add-other").addEventListener("click", () => {
  if (!selectedDate) { alert("Select a date first"); return; }
  const desc = document.getElementById("other-desc").value.trim();
  const amount = Number(document.getElementById("other").value);
  if (!desc || amount <= 0) { alert("Enter description & positive amount"); return; }

  const key = dateKey(selectedDate);
  if (!expenses[key]) expenses[key] = { breakfast:0,lunch:0,snacks:0,dinner:0,other:[] };
  expenses[key].other.push({ desc, amount });

  document.getElementById("other-desc").value = "";
  document.getElementById("other").value = 0;
  renderOtherList(expenses[key].other);
});

function renderOtherList(list) {
  const ul = document.getElementById("other-list");
  ul.innerHTML = "";
  list.forEach((item,idx) => {
    const li = document.createElement("li");
    li.textContent = `${item.desc}: ₹${item.amount}`;
    const btn = document.createElement("button");
    btn.textContent = "x"; btn.className = "mini-btn";
    btn.onclick = () => { list.splice(idx,1); renderOtherList(list); updateTotals(); };
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

document.getElementById("save-expense").addEventListener("click", () => {
  if (!selectedDate) { alert("Select a date"); return; }
  const key = dateKey(selectedDate);
  const existing = expenses[key] || { other:[] };
  expenses[key] = {
    breakfast:Number(document.getElementById("breakfast").value),
    lunch:Number(document.getElementById("lunch").value),
    snacks:Number(document.getElementById("snacks").value),
    dinner:Number(document.getElementById("dinner").value),
    other:existing.other
  };
  localStorage.setItem("expenses",JSON.stringify(expenses));
  generateCalendar(currentMonth,currentYear);
  updateTotals();
});

/* ====== Totals ====== */
function dayTotal(v) {
  return (v.breakfast||0)+(v.lunch||0)+(v.snacks||0)+(v.dinner||0)+(v.other||[]).reduce((s,o)=>s+o.amount,0);
}
function updateTotals() {
  const salary = Number(localStorage.getItem("salary"))||0;
  const bank = Number(localStorage.getItem("bank"))||0;
  let dailyTotal=0;
  if (selectedDate) {
    const key=dateKey(selectedDate);
    dailyTotal=expenses[key]?dayTotal(expenses[key]):0;
  }
  let monthlyTotal=0; const shownMonth=pad(currentMonth+1); const shownYear=currentYear;
  for (const k in expenses) {
    const [y,m] = k.split("-");
    if (Number(y)===shownYear && m===shownMonth) monthlyTotal+=dayTotal(expenses[k]);
  }
  document.getElementById("daily-total").textContent=dailyTotal;
  document.getElementById("monthly-total").textContent=monthlyTotal;
  const savings=salary+bank-monthlyTotal;
  const savEl=document.getElementById("savings");
  savEl.textContent=savings; savEl.style.color=savings<0?"red":"green";
}

function highlightRow(row) {
  if (!row) return;
  row.classList.add("highlight");
  setTimeout(()=>row.classList.remove("highlight"),1800);
}

/* ====== Transactions ====== */
function renderTransactions() {
  const tbody=document.querySelector("#transaction-table tbody");
  tbody.innerHTML="";
  transactions.forEach((t,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${t.type}</td>
      <td>${t.person||"Undefined"}</td>
      <td class="red">${t.amount}</td>
      <td>${t.status}</td>
      <td>
        <button onclick="editTransaction(${i})">Edit</button>
        <button onclick="deleteTransaction(${i})">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}
function deleteTransaction(i) {
  transactions.splice(i,1);
  localStorage.setItem("transactions",JSON.stringify(transactions));
  renderTransactions();
}
window.editTransaction=function(i){
  const tbody=document.querySelector("#transaction-table tbody");
  const row=tbody.children[i]; const t=transactions[i];
  row.cells[0].innerHTML=`<input value="${t.type}">`;
  row.cells[1].innerHTML=`<input value="${t.person}">`;
  row.cells[2].innerHTML=`<input type="number" value="${t.amount}">`;
  row.cells[3].innerHTML=`<input value="${t.status}">`;
  row.cells[4].innerHTML=`<button onclick="saveTransaction(${i})">Save</button>`;
};
window.saveTransaction=function(i){
  const tbody=document.querySelector("#transaction-table tbody");
  const row=tbody.children[i];
  transactions[i]={type:row.cells[0].querySelector("input").value,person:row.cells[1].querySelector("input").value,amount:Number(row.cells[2].querySelector("input").value),status:row.cells[3].querySelector("input").value};
  localStorage.setItem("transactions",JSON.stringify(transactions));
  renderTransactions(); highlightRow(tbody.children[i]);
};
document.getElementById("save-transaction").addEventListener("click",()=>{
  const person=document.getElementById("person").value.trim();
  const amount=Number(document.getElementById("amount").value);
  const type=document.getElementById("type").value;
  const status=document.getElementById("status").value;
  if(!person||amount<=0){alert("Enter person and positive amount");return;}
  transactions.push({person,amount,type,status});
  localStorage.setItem("transactions",JSON.stringify(transactions));
  renderTransactions();
  const tbody=document.querySelector("#transaction-table tbody"); highlightRow(tbody.lastElementChild);
  document.getElementById("person").value=""; document.getElementById("amount").value="";
});

/* ====== Investments ====== */
function renderInvestments(){
  const tbody=document.querySelector("#investment-table tbody");
  tbody.innerHTML="";
  investments.forEach((inv,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${inv.type}</td>
      <td>${inv.name||"Undefined"}</td>
      <td class="red">${inv.amount}</td>
      <td>${inv.start||""}</td>
      <td>${inv.end||""}</td>
      <td>${inv.status}</td>
      <td>
        <button onclick="editInvestment(${i})">Edit</button>
        <button onclick="deleteInvestment(${i})">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}
function deleteInvestment(i){investments.splice(i,1);localStorage.setItem("investments",JSON.stringify(investments));renderInvestments();}
window.editInvestment=function(i){
  const tbody=document.querySelector("#investment-table tbody");
  const row=tbody.children[i]; const inv=investments[i];
  row.cells[0].innerHTML=`<input value="${inv.type}">`;
  row.cells[1].innerHTML=`<input value="${inv.name||""}">`;
  row.cells[2].innerHTML=`<input type="number" value="${inv.amount}">`;
  row.cells[3].innerHTML=`<input type="date" value="${inv.start||""}">`;
  row.cells[4].innerHTML=`<input type="date" value="${inv.end||""}">`;
  row.cells[5].innerHTML=`<input value="${inv.status}">`;
  row.cells[6].innerHTML=`<button onclick="saveInvestment(${i})">Save</button>`;
};
window.saveInvestment=function(i){
  const tbody=document.querySelector("#investment-table tbody");
  const row=tbody.children[i];
  investments[i]={type:row.cells[0].querySelector("input").value,name:row.cells[1].querySelector("input").value,amount:Number(row.cells[2].querySelector("input").value),start:row.cells[3].querySelector("input").value,end:row.cells[4].querySelector("input").value,status:row.cells[5].querySelector("input").value};
  localStorage.setItem("investments",JSON.stringify(investments));
  renderInvestments(); highlightRow(tbody.children[i]);
};
document.getElementById("save-investment").addEventListener("click",()=>{
  const type=document.getElementById("inv-type").value;
  const name=document.getElementById("inv-name").value.trim();
  const amount=Number(document.getElementById("inv-amount").value);
  const start=document.getElementById("inv-start").value;
  const end=document.getElementById("inv-end").value;
  const status=document.getElementById("inv-status").value;
  if(!name||amount<=0){alert("Enter name and positive amount");return;}
  investments.push({type,name,amount,start,end,status});
  localStorage.setItem("investments",JSON.stringify(investments));
  renderInvestments();
  const tbody=document.querySelector("#investment-table tbody"); highlightRow(tbody.lastElementChild);
  document.getElementById("inv-name").value="";document.getElementById("inv-amount").value="";document.getElementById("inv-start").value="";document.getElementById("inv-end").value="";
});

/* ====== Credits ====== */
function renderCredits(){
  const tbody=document.querySelector("#credit-table tbody");
  tbody.innerHTML="";
  credits.forEach((c,i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${c.name||"Undefined"}</td>
      <td class="red">${c.amount}</td>
      <td>${c.due||""}</td>
      <td>${c.status}</td>
      <td>
        <button onclick="editCredit(${i})">Edit</button>
        <button onclick="deleteCredit(${i})">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}
function deleteCredit(i){credits.splice(i,1);localStorage.setItem("credits",JSON.stringify(credits));renderCredits();}
window.editCredit=function(i){
  const tbody=document.querySelector("#credit-table tbody");
  const row=tbody.children[i]; const c=credits[i];
  row.cells[0].innerHTML=`<input value="${c.name||""}">`;
  row.cells[1].innerHTML=`<input type="number" value="${c.amount}">`;
  row.cells[2].innerHTML=`<input type="date" value="${c.due||""}">`;
  row.cells[3].innerHTML=`<input value="${c.status}">`;
  row.cells[4].innerHTML=`<button onclick="saveCredit(${i})">Save</button>`;
};
window.saveCredit=function(i){
  const tbody=document.querySelector("#credit-table tbody");
  const row=tbody.children[i];
  credits[i]={name:row.cells[0].querySelector("input").value,amount:Number(row.cells[1].querySelector("input").value),due:row.cells[2].querySelector("input").value,status:row.cells[3].querySelector("input").value};
  localStorage.setItem("credits",JSON.stringify(credits));
  renderCredits(); highlightRow(tbody.children[i]);
};
document.getElementById("save-credit").addEventListener("click",()=>{
  const name=document.getElementById("credit-name").value.trim();
  const amount=Number(document.getElementById("credit-amount").value);
  const due=document.getElementById("credit-due").value;
  const status=document.getElementById("credit-status").value;
  if(!name||amount<=0){alert("Enter card name and positive amount");return;}
  credits.push({name,amount,due,status});
  localStorage.setItem("credits",JSON.stringify(credits));
  renderCredits();
  const tbody=document.querySelector("#credit-table tbody"); highlightRow(tbody.lastElementChild);
  document.getElementById("credit-name").value="";document.getElementById("credit-amount").value="";document.getElementById("credit-due").value="";
});

/* ====== Init ====== */
generateCalendar(currentMonth,currentYear);
renderTransactions();
renderInvestments();
renderCredits();
updateTotals();
