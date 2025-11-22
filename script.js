"use strict";

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

/////////////////////////////////////////////////
// Data

// DIFFERENT DATA! Contains movement dates, currency and locale

const account1 = {
  owner: "Jonas Schmedtmann",
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    "2019-11-18T21:31:17.178Z",
    "2019-12-23T07:42:02.383Z",
    "2020-01-28T09:15:04.904Z",
    "2020-04-01T10:17:24.185Z",
    "2020-05-08T14:11:59.604Z",
    "2025-11-08T17:01:17.194Z",
    "2025-11-11T23:36:17.929Z",
    "2025-11-15T10:51:36.790Z",
  ],
  currency: "EUR",
  locale: "pt-PT", // de-DE
};

const account2 = {
  owner: "Jessica Davis",
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    "2019-11-01T13:15:33.035Z",
    "2019-11-30T09:48:16.867Z",
    "2019-12-25T06:04:23.907Z",
    "2020-01-25T14:18:46.235Z",
    "2020-02-05T16:33:06.386Z",
    "2020-04-10T14:43:26.374Z",
    "2020-06-25T18:49:59.371Z",
    "2025-11-16T12:01:20.894Z",
  ],
  currency: "USD",
  locale: "en-US",
};

const accounts = [account1, account2];

/////////////////////////////////////////////////
// Elements
const labelWelcome = document.querySelector(".welcome");
const labelDate = document.querySelector(".date");
const labelBalance = document.querySelector(".balance__value");
const labelSumIn = document.querySelector(".summary__value--in");
const labelSumOut = document.querySelector(".summary__value--out");
const labelSumInterest = document.querySelector(".summary__value--interest");
const labelTimer = document.querySelector(".timer");

const containerApp = document.querySelector(".app");
const containerMovements = document.querySelector(".movements");

const btnLogin = document.querySelector(".login__btn");
const btnTransfer = document.querySelector(".form__btn--transfer");
const btnLoan = document.querySelector(".form__btn--loan");
const btnClose = document.querySelector(".form__btn--close");
const btnSort = document.querySelector(".btn--sort");

const inputLoginUsername = document.querySelector(".login__input--user");
const inputLoginPin = document.querySelector(".login__input--pin");
const inputTransferTo = document.querySelector(".form__input--to");
const inputTransferAmount = document.querySelector(".form__input--amount");
const inputLoanAmount = document.querySelector(".form__input--loan-amount");
const inputCloseUsername = document.querySelector(".form__input--user");
const inputClosePin = document.querySelector(".form__input--pin");

/////////////////////////////////////////////////
//////////// Global variables //////////////////
let currentAccount;
let sorted = false;
let logoutTime, timer;

/////////////////////////////////////////////////
// functions

/////////////////////////////////////////////////
//Creating initials from fullname (username)
const createInitials = function (fullName) {
  const firName = fullName.slice(0, fullName.indexOf(" ")).at(0);
  const lasName = fullName.slice(fullName.indexOf(" ") + 1).at(0);
  const initials = `${firName}${lasName}`;
  return initials.toLowerCase();
};

// Adding the initials to the account object
const createUsername = accounts.map((account) => {
  account.username = createInitials(account.owner);
  return account.username;
});

// //parsing DD/MM/YYYY into a valid date
// const parseDDMMYYYY = function (dateStr) {
//   if (!dateStr) return null; // safeguards from empty entries
//   const [year, month, day] = dateStr.split("/");
//   return new Date(Date.UTC(year, month - 1, day));
// };

/////////////////////////////////////////////////
// formating dates and time (Internalization)
const formatDatesTime4movements = function (dateObj, locale) {
  //Converting date string to date object
  if (!dateObj || isNaN(dateObj)) return `Invalid date`;

  // Setting both dates to midnight
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  dateObj.setHours(0, 0, 0, 0);

  // Calculationg number of days passed
  const dayDifference = Math.floor(
    (currentDate - dateObj) / (1000 * 60 * 60 * 24)
  );

  //   conditioning output based on the number of days passed
  if (dayDifference < 1) {
    return `today`;
  } else if (dayDifference === 1) {
    return `yesterday`;
  } else if (dayDifference > 1 && dayDifference <= 7) {
    return `${dayDifference} days ago`;
  } else {
    // Formatting the date if more than a week has passed (loxale-aware formating for UI display)
    return Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dateObj);
  }
};

/////////////////////////////////////////////////
// format numbers
const formatNum = function (num, account) {
  return new Intl.NumberFormat(account.locale, {
    style: "currency",
    currency: account.currency,
  }).format(num);
};

/////////////////////////////////////////////////
const ensureMovesAndDates = function (account) {
  if (!account.movesAndDates) {
    //   Creating a new object for both movements and movementsDates
    account.movesAndDates = {
      movementsFlow: account.movements,
      eventDates: account.movementsDates.map((date) => {
        if (typeof date === "string" && date.includes("/")) {
          const [day, month, year] = date.split("/");
          return new Date(Date.UTC(year, month - 1, day)).toISOString();
        }
        return new Date(date).toISOString(); // in a case where date is already ISO or a dete object
      }),
    }; //// need to understand this logic for sortong through the array
  }
};

/////////////////////////////////////////////////
const buildPairs = function (account) {
  return account.movesAndDates.movementsFlow.map((amount, i) => ({
    amount,
    date: account.movesAndDates.eventDates[i],
  }));
};

/////////////////////////////////////////////////
// Display Movements
const displayMovements = function (account) {
  // Clearing current contents
  containerMovements.innerHTML = "";

  // Ensuring account has movesAndDates
  ensureMovesAndDates(account);

  //   Alligning sorting function with movements and dates
  const pairs = sorted
    ? sortMovements(buildPairs(account, true))
    : buildPairs(account);

  // Initializing type to store movements type (Deposits || withdrawals)
  pairs.forEach(function (pair, i) {
    let type = pair.amount > 0 ? "deposit" : "withdrawal";

    //Internal storage
    const isoData = pair.date;
    const UIDate = new Date(isoData);

    // Internalizationalizimg movementsDates
    const formattedDate = formatDatesTime4movements(UIDate, account.locale);

    // Constructing movements HTML
    const html = `<div class="movements__row">
          <div class="movements__type movements__type--${type}">${
      i + 1
    } ${type}</div>
          <div class="movements__date">${formattedDate} </div>
          <div class="movements__value">${formatNum(pair.amount, account)}</div>
        </div>`;

    containerMovements.insertAdjacentHTML("afterbegin", html);
  });
};

/////////////////////////////////////////////////
// Display UI
const displayUI = () => (containerApp.style.opacity = 1);

/////////////////////////////////////////////////
// Calculating and displaying balance
const displayBalance = function (account) {
  const calcBalance = account.movements.reduce(
    (accum, moves) => (accum += moves),
    0
  );
  //  Balance display
  labelBalance.textContent = formatNum(calcBalance, account);
};

/////////////////////////////////////////////////
// display summary
const displaySummary = function (account) {
  const totalDeposits = account.movements
    .filter((move) => move > 0) // filter only deposits
    .reduce((accum, move) => (accum += move), 0); //sums up deposits and add to accumulator
  labelSumIn.textContent = formatNum(totalDeposits, account);

  const totalWithdrawals = account.movements
    .filter((move) => move < 0) // filter only withdrawals
    .reduce((accum, move) => (accum += move), 0); //sums up withdrawals and add to accumulator
  labelSumOut.textContent = formatNum(Math.abs(totalWithdrawals), account);

  const totalInterest = account.movements
    .filter((move) => move > 0) // filter only deposits
    .reduce((accum, move) => {
      accum += (move * account.interestRate) / 100; // calculate interest and adds to accumulator
      return accum; // returns accumulator
    }, 0); //Initializes accumulator to start at 0
  labelSumInterest.textContent = formatNum(totalInterest, account);
};

/////////////////////////////////////////////////
const updateDate = function () {
  const now = new Date();
  labelDate.textContent = new Intl.DateTimeFormat(currentAccount.locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(now);
};

/////////////////////////////////////////////////
// Update UI
const updateUI = function (account) {
  displayUI();
  displayMovements(currentAccount);
  displayBalance(currentAccount);
  displaySummary(currentAccount);

  // Displaying welcome text
  labelWelcome.textContent = `welcome back ${currentAccount.owner.slice(
    0,
    currentAccount.owner.indexOf(" ")
  )}`;

  ///// Time internationalization and display  /////
  // Update date
  updateDate();

  const labelDateTimer = setInterval(() => updateDate(), 1000);
};

// Add movements
const addMovesAndDates = function (
  account,
  movement,
  date = new Date().toISOString()
) {
  account?.movesAndDates?.movementsFlow.push(movement);
  account?.movesAndDates?.eventDates.push(date);
};

/////////////////////////////////////////////////
////////////// Timer functionality /////////////

// Set Timer function
const formatTimer = function (num) {
  let minutes = Math.floor(num / 60);
  let seconds = num % 60;
  let time = `${String(minutes).padStart(2, 0)}:${String(seconds).padStart(
    2,
    0
  )}`;
  labelTimer.textContent = time;
};

timer = function (min = 0.1) {
  //Initializing counter variable
  let counter = min * 60;

  formatTimer(counter);

  // set interval
  logoutTime = setInterval(() => {
    if (counter < 0) {
      clearInterval(logoutTime);
      logUserOut();
    } else {
      //Displaying formatted time
      formatTimer(counter);
      counter--;
    }
  }, 1000);
  return logoutTime;
};

// canceling logout time once conter elapses

/////////////////////////////////////////////////
// function fot resetting time
const resetTimer = function () {
  // Clear existing timer if any
  if (logoutTime) clearInterval(logoutTime);
  // Start timer
  logoutTime = timer();
};

/////////////////////////////////////////////////
///////////// Sort function ////////////////////

const sortMovements = function (pairs, sorted = false) {
  // Return zipped movements and dates together
  return pairs.toSorted((a, b) => a.amount - b.amount);
};

////////////////////////////////////////////////
///////////// log out function ////////////////////
const logUserOut = function () {
  // set welcome message back to default text
  labelWelcome.textContent = "Log in to get started";
  // Hide UI
  containerApp.style.opacity = 0;
};

/////////////////////////////////////////////////
////////////// Event Handlers///////////////////

// login button handler
btnLogin.addEventListener("click", function (e) {
  // preventing default input button from triggering page reload
  e.preventDefault();

  const inputUser = inputLoginUsername.value;
  const inputPin = +inputLoginPin.value;

  // Checking login credentials
  if (inputLoginUsername.value !== "" && inputLoginPin.value !== "") {
    currentAccount = accounts?.find(
      (account) => account.username === inputUser
    );
  } else {
    console.log(`Input field must have valid entries`);
    return;
  }

  if (inputPin === currentAccount.pin) {
    // Updating UI
    updateUI(currentAccount);
    // Activating and resetting timer
    resetTimer();
  } else {
    console.log(`Invalid entries`);
    // return;
  }

  //Clearing input fields
  inputLoginUsername.value = "";
  inputLoginPin.value = "";
});

// Transfer button functionality
btnTransfer.addEventListener("click", function (e) {
  // preventing default input button from triggering page reload
  e.preventDefault();

  // Resetting Timer
  resetTimer();

  const transferAmount = +inputTransferAmount.value;

  // checking if transferTo input is valid
  const validUsername = accounts.some(
    (account) => account.username === inputTransferTo.value
  );

  // Identifying transferRecipient
  const transferRecipient = accounts.find((account) =>
    account.username.includes(inputTransferTo.value)
  );

  //Implementing transfer conditions
  if (
    validUsername &&
    transferRecipient.username !== currentAccount.username &&
    transferAmount > 0
  ) {
    //Ensuring both account have movesAndDates
    ensureMovesAndDates(currentAccount);
    ensureMovesAndDates(transferRecipient);

    // Add the dates & withdrawal value of the transfer input to the currentAccount movements
    addMovesAndDates(currentAccount, -transferAmount);

    // Add the deposit value of the transfer input to the transferRecipient movements
    addMovesAndDates(transferRecipient, transferAmount);

    // update UI
    updateUI(currentAccount);

    inputTransferAmount.value = "";
    inputTransferTo.value = "";
  }
});

// btnloan Handler
btnLoan.addEventListener("click", function (e) {
  // Preventing input button auto page reload
  e.preventDefault();

  // Resetting Timer
  resetTimer();

  // Initializing variable representation of inputLoanAmount DOM ELement
  const loanAmount = +inputLoanAmount.value;

  // finding largest deposit
  if (loanAmount === "") return;

  const largestDeposit = currentAccount?.movesAndDates?.movementsFlow
    .filter((movement) => movement > 0)
    .reduce(
      (largest, deposit) => (deposit > largest ? (largest = deposit) : largest),
      0
    );

  // Calculating 10 Percent of Largest Amount
  const tenPercentOfLargestDeposit = largestDeposit * 0.1;

  // Implementing Loan criteria
  if (loanAmount <= tenPercentOfLargestDeposit && loanAmount > 0) {
    setTimeout(() => {
      addMovesAndDates(currentAccount, loanAmount);
      // UPdate UI
      updateUI(currentAccount);
    }, 5000);
  } else {
    return;
  }

  // Clearing input field
  inputLoanAmount.value = "";
});

// sort button handler
btnSort.addEventListener("click", function () {
  // Resetting Timer
  resetTimer();

  // resetting the sort global variable (toggle)
  sorted = !sorted;

  // refresh the UI
  displayMovements(currentAccount);
});

// button Close Handler
btnClose.addEventListener("click", function (e) {
  //Preventing page reload
  e.preventDefault();

  // Resetting Timer
  resetTimer();

  // Initializing the DOM Elements
  const closeUsername = inputCloseUsername.value;
  const closePin = +inputClosePin.value;

  // identifying about to be closed account
  const closeAccount = accounts.find(
    (locator) => locator.username === closeUsername
  );

  //Checking if the input field credentials are correct
  if (
    // checking if if closeUsername matches the closeAccount username property and that it matches logged in account
    currentAccount.username === closeAccount.username &&
    closeAccount.pin === closePin
  ) {
    // Deleting closeAccount using the splice method
    const closeAccIndex = accounts.indexOf(closeAccount);
    accounts.splice(closeAccIndex, 1);

    // then log out ==== hide UI
    logUserOut();
  }
});
