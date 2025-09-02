let expenses=JSON.parse(localStorage.getItem("expenses")||"{}");
let transactions=JSON.parse(localStorage.getItem("transactions")||"[]");
let investments=JSON.parse(localStorage.getItem("investments")||"[]");
let credits=JSON.parse(localStorage.getItem("credits")||"[]");

// Tabs
const tabs=document.querySelectorAll(".tab-btn");
const tabContents=document.querySelectorAll(".tab-content");
tabs.forEach(tab=>tab.addEventListener("click",()=>{
  tabs.forEach(t=>t.classList.remove("active"));
  tab.classList.add("active");
  tabContents.forEach(tc=>tc.classList.remove("active"));
  document.getElementById(tab.dataset.tab).classList.add("active");
}));

// Calendar
let currentDate=new Date();
let currentMonth=currentDate.getMonth(), currentYear=currentDate.getFullYear();
let selectedDate=null;

function generateCalendar(month=currentMonth, year=currentYear){
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  document.getElementById("month-year").textContent = `${monthNames[month]} ${year}`;
  let firstDay = new Date(year, month, 1).getDay();
  for(let i=0;i<firstDay;i++) calendar.appendChild(document.createElement("div"));
  let daysInMonth = new Date(year, month+1, 0).getDate();
  for(let d=1;d<=daysInMonth;d++){
    let dayDiv=document.createElement("div");
    dayDiv.classList.add("calendar-day");
    dayDiv.textContent=d;
    const key=`${year}-${month+1}-${d}`;
    if(expenses[key]){
      const total=expenses[key].breakfast+expenses[key].lunch+expenses[key].snacks+expenses[key].dinner+expenses[key].other;
      if(total<100) dayDiv.classList.add("low");
      else if(total<=200) dayDiv.classList.add("medium");
      else dayDiv.classList.add("high");
    }
    dayDiv.addEventListener("click",()=>{
      selectedDate=new Date(year,month,d);
      document.getElementById("selected-date").textContent=formatDate(selectedDate);
      loadDailyExpense();
    });
    calendar.appendChild(dayDiv);
  }
}
document.getElementById("prev-month").addEventListener("click",()=>{currentMonth--; if(currentMonth<0){currentMonth=11;currentYear--;} generateCalendar(currentMonth,currentYear)});
document.getElementById("next-month").addEventListener("click",()=>{currentMonth++; if(currentMonth>11){currentMonth=0;currentYear++;} generateCalendar(currentMonth,currentYear)});
function formatDate(d){const mm=('0'+(d.getMonth()+1)).slice(-2),dd=('0'+d.getDate()).slice(-2),yyyy=d.getFullYear();return `${yyyy}/${mm}/${dd}`;}

// Daily Expenses
function loadDailyExpense(){
  if(!selectedDate) return;
  const key=`${selectedDate.getFullYear()}-${selectedDate.getMonth()+1}-${selectedDate.getDate()}`;
  const dayExp=expenses[key]||{breakfast:0,lunch:0,snacks:0,dinner:0,other:0};
  document.getElementById("breakfast").value=dayExp.breakfast;
  document.getElementById("lunch").value=dayExp.lunch;
  document.getElementById("snacks").value=dayExp.snacks;
  document.getElementById("dinner").value=dayExp.dinner;
  document.getElementById("other").value=dayExp.other;
  updateTotals();
}
document.getElementById("save-expense").addEventListener("click",()=>{
  if(!selectedDate){alert("Select a date");return;}
  const key=`${selectedDate.getFullYear()}-${selectedDate.getMonth()+1}-${selectedDate.getDate()}`;
  expenses[key]={breakfast:Number(document.getElementById("breakfast").value),lunch:Number(document.getElementById("lunch").value),snacks:Number(document.getElementById("snacks").value),dinner:Number(document.getElementById("dinner").value),other:Number(document.getElementById("other").value)};
  localStorage.setItem("expenses",JSON.stringify(expenses));
  generateCalendar();
  document.getElementById("breakfast").value=0;
  document.getElementById("lunch").value=0;
  document.getElementById("snacks").value=0;
  document.getElementById("dinner").value=0;
  document.getElementById("other").value=0;
  updateTotals();
});

// Totals
function updateTotals(){
  const salary=Number(document.getElementById("salary").value)||0;
  const bank=Number(document.getElementById("bank").value)||0;
  let dailyTotal=0,monthlyTotal=0;
  if(selectedDate){
    const key=`${selectedDate.getFullYear()}-${selectedDate.getMonth()+1}-${selectedDate.getDate()}`;
    const v=expenses[key]||{breakfast:0,lunch:0,snacks:0,dinner:0,other:0};
    dailyTotal=v.breakfast+v.lunch+v.snacks+v.dinner+v.other;
    for(const k in expenses){
      const val=expenses[k];
      monthlyTotal+=val.breakfast+val.lunch+val.snacks+val.dinner+val.other;
    }
  }
  document.getElementById("daily-total").textContent=dailyTotal;
  document.getElementById("monthly-total").textContent=monthlyTotal;
  const savings=salary+bank-monthlyTotal;
  document.getElementById("savings").textContent=savings;
  document.getElementById("savings").style.color=savings<0?'red':'green';
}

// Transactions
function capitalize(str){return str.charAt(0).toUpperCase()+str.slice(1);}
function renderTransactions(){
  const tbody=document.querySelector("#transaction-table tbody");tbody.innerHTML="";
  transactions.forEach((t,i)=>{
    let tr=document.createElement("tr");
    tr.innerHTML=`<td>${capitalize(t.type)}</td><td>${t.person||"Undefined"}</td><td class="red">${t.amount}</td><td class="${t.status.toLowerCase()}">${capitalize(t.status)}</td>
    <td><button onclick="editTransaction(${i})">Update</button> <button onclick="deleteTransaction(${i})">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}
function deleteTransaction(i){transactions.splice(i,1);localStorage.setItem("transactions",JSON.stringify(transactions));renderTransactions();}
function editTransaction(i){
  const t=transactions[i];
  const newAmount=Number(prompt("Enter new amount:",t.amount))||t.amount;
  t.amount=newAmount;localStorage.setItem("transactions",JSON.stringify(transactions));renderTransactions();
}
document.getElementById("save-transaction").addEventListener("click",()=>{
  const person=document.getElementById("person").value;
  const amount=Number(document.getElementById("amount").value);
  const type=document.getElementById("type").value;
  const status=document.getElementById("status").value;
  let found=false;
  transactions.forEach(t=>{if(t.person===person && t.type===type){t.amount+=amount;found=true;}});
  if(!found) transactions.push({person,amount,type,status});
  localStorage.setItem("transactions",JSON.stringify(transactions));
  renderTransactions();
  document.getElementById("person").value=""; document.getElementById("amount").value="";
});

// Investments
function renderInvestments(){
  const tbody=document.querySelector("#investment-table tbody");tbody.innerHTML="";
  investments.forEach((i,idx)=>{
    let tr=document.createElement("tr");
    tr.innerHTML=`<td>${i.type}</td><td>${i.name||"Undefined"}</td><td class="red">${i.amount}</td><td>${i.start}</td><td>${i.end}</td><td>${i.status}</td>
    <td><button onclick="editInvestment(${idx})">Update</button> <button onclick="deleteInvestment(${idx})">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}
function deleteInvestment(i){investments.splice(i,1);localStorage.setItem("investments",JSON.stringify(investments));renderInvestments();}
function editInvestment(i){
  const inv=investments[i];
  const newAmount=Number(prompt("Enter new amount:",inv.amount))||inv.amount;
  inv.amount=newAmount;localStorage.setItem("investments",JSON.stringify(investments));renderInvestments();
}
document.getElementById("save-investment").addEventListener("click",()=>{
  const type=document.getElementById("inv-type").value;
  const name=document.getElementById("inv-name").value;
  const amount=Number(document.getElementById("inv-amount").value);
  const start=document.getElementById("inv-start").value;
  const end=document.getElementById("inv-end").value;
  const status=document.getElementById("inv-status").value;
  let found=false;
  investments.forEach(i=>{if(i.name===name && i.type===type){i.amount+=amount;found=true;}});
  if(!found) investments.push({type,name,amount,start,end,status});
  localStorage.setItem("investments",JSON.stringify(investments));
  renderInvestments();
  document.getElementById("inv-type").selectedIndex=0;document.getElementById("inv-name").value="";document.getElementById("inv-amount").value="";document.getElementById("inv-start").value="";document.getElementById("inv-end").value="";document.getElementById("inv-status").selectedIndex=0;
});

// Credit Cards
function renderCredits(){
  const tbody=document.querySelector("#credit-table tbody");tbody.innerHTML="";
  credits.forEach((c,i)=>{
    let tr=document.createElement("tr");
    tr.innerHTML=`<td>${c.name||"Undefined"}</td><td class="red">${c.amount}</td><td>${c.due}</td><td class="${c.status.toLowerCase()}">${capitalize(c.status)}</td>
    <td><button onclick="editCredit(${i})">Update</button> <button onclick="deleteCredit(${i})">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}
function deleteCredit(i){credits.splice(i,1);localStorage.setItem("credits",JSON.stringify(credits));renderCredits();}
function editCredit(i){
  const c=credits[i];
  const newAmount=Number(prompt("Enter new amount:",c.amount))||c.amount;
  c.amount=newAmount;localStorage.setItem("credits",JSON.stringify(credits));renderCredits();
}
document.getElementById("save-credit").addEventListener("click",()=>{
  const name=document.getElementById("credit-name").value;
  const amount=Number(document.getElementById("credit-amount").value);
  const due=document.getElementById("credit-due").value;
  const status=document.getElementById("credit-status").value;
  let found=false;
  credits.forEach(c=>{if(c.name===name && c.status===status){c.amount+=amount;found=true;}});
  if(!found) credits.push({name,amount,due,status});
  localStorage.setItem("credits",JSON.stringify(credits));
  renderCredits();
  document.getElementById("credit-name").value="";document.getElementById("credit-amount").value="";document.getElementById("credit-due").value="";document.getElementById("credit-status").selectedIndex=0;
});

// Initial load
generateCalendar();
loadDailyExpense();
renderTransactions();
renderInvestments();
renderCredits();
updateTotals();
