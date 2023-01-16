const calculateEMI = (principal, rate, tenure) => {
    const tenureInMonth = tenure * 12
    const monthlyRate = rate / (12 * 100)
    return Math.round((principal * monthlyRate * Math.pow((1 + monthlyRate), tenureInMonth)) /
        (Math.pow((1 + monthlyRate), tenureInMonth) - 1))
}
const MONTH_ARRAY = ['January', 'February', 'March',
    'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December']
const getLoanPeriod = (period) => {
    const index = MONTH_ARRAY.indexOf(period.Month)
    if (index === 11) {
        return {
            'Month': MONTH_ARRAY[0],
            'Year': period.Year + 1
        }
    } else {
        return {
            'Month': MONTH_ARRAY[index + 1],
            'Year': period.Year
        }
    }
}
const calculateMonthlyDetails = (info, rate, prePaymentInfo) => {
    const period = getLoanPeriod({ 'Month': info.Month, 'Year': info.Year })
    const monthlyRate = rate / (12 * 100)
    const interestPaid = info.Next_Principal_Remaining * monthlyRate
    const principalPaid = info.Emi - interestPaid
    let principalRemaining = info.Next_Principal_Remaining - principalPaid

    if (prePaymentInfo.Is_PrePayment) {
        principalRemaining = principalRemaining - prePaymentInfo.Amount
    }
    return {
        'Principal_Paid': Number(principalPaid.toFixed(2)),
        'Interest_Paid': Number(interestPaid.toFixed(2)),
        'Next_Principal_Remaining': Number(principalRemaining.toFixed(2)),
        'Monthly_Saving': Number((prePaymentInfo.Next_PrePayment / 12).toFixed(2)),
        'PrePayment': prePaymentInfo.Is_PrePayment ? prePaymentInfo.Amount : 0,
        'Month': period.Month,
        'Year': period.Year,
        'Emi': info.Emi
    }
}
const getNextPrePaymentAmount = (amount, percentage) => amount * (100 + percentage) / 100

const getPrePaymentInfo = (info, month) => {
    if (month !== MONTH_ARRAY[2]) info.Is_PrePayment = false

    if (month === MONTH_ARRAY[2]) {
        info.Is_PrePayment = true

        if (info.Is_First_PrePayment) {
            info.Amount = info.Next_PrePayment
            info.Is_First_PrePayment = false
            info.Next_PrePayment = getNextPrePaymentAmount(info.Amount, info.Increase_Percentage)
        } else {
            info.Amount = info.Next_PrePayment
            info.Next_PrePayment = getNextPrePaymentAmount(info.Amount, info.Increase_Percentage)
        }
    }
    return info
}



const collectInput = () => {
    const period = document.getElementById("StartPeriod").value.split("-")
    return {
        'Principal': +document.getElementById("Amount").value,
        'Rate': +document.getElementById("Rate").value,
        'Tenure': +document.getElementById("Tenure").value,
        'Year': +period[0],
        'Month': MONTH_ARRAY[period[1] - 1],
        'Pre_Payment_Amount': +document.getElementById("PrePaymentAmount").value,
        'Pre_Payment_Increase': +document.getElementById("PrePaymentIncrease").value,
    }
}
const renderLoanEndMsg = (details) => {
    document.getElementById("LoanEndPeriod").innerText = `${details.Month} , ${details.Year}`
    document.getElementById("EMI").innerText = `${details.Emi} `
}

const renderLoanBreakup = (loanDetail) => {
 
    let content = `
        <table class="table table-striped">
            <thead class="bg-table text-light">
                <tr>
                    <th>Month</th>
                    <th>Year</th>
                    <th>Principal Paid</th>
                    <th>Interest Paid</th>
                    <th>Principal Remaining</th>
                    <th>Principal Pre Payment</th>
                    <th>Pre Payment Monthly Savings</th>
                </tr>
            </thead>
            <tbody>
    `
    loanDetail.forEach(info => {
        content +=`
        <tr>
            <td>${info.Month}</td>
            <td>${info.Year}</td>
            <td>${info.Principal_Paid}</td>
            <td>${info.Interest_Paid}</td>
            <td>${info.Next_Principal_Remaining}</td>
            <td>${info.PrePayment}</td>
            <td>${info.Monthly_Saving}</td>
        </tr>`
    });
    content += `</tbody></table>`

    document.getElementById("LoanBreakup").innerHTML = content
}

function generateDetails() { 
    const inputDetails = collectInput() 
    console.log(inputDetails);
    const emi = calculateEMI(inputDetails.Principal, inputDetails.Rate, inputDetails.Tenure)

    let result = []


    const prePaymentAmount = inputDetails.Pre_Payment_Amount
    const prePaymentIncrease = inputDetails.Pre_Payment_Increase

    let prePaymentInfo = {
        'Amount': 0,
        'Next_PrePayment': prePaymentAmount,
        'Increase_Percentage': prePaymentIncrease,
        'Previous_Amount': 0,
        'Is_First_PrePayment': true,
        'Is_PrePayment': false,
    }
    let monthlyInfo = {
        'Next_Principal_Remaining': inputDetails.Principal,
        'Emi': emi,
        'Month': inputDetails.Month,
        'Year': inputDetails.Year
    }
    for (; true;) {

        monthlyInfo = calculateMonthlyDetails(monthlyInfo, inputDetails.Rate, prePaymentInfo)

        if (monthlyInfo.Next_Principal_Remaining > 0) {
            result.push(monthlyInfo)
        } else {
            break;
        }
        prePaymentInfo = getPrePaymentInfo(prePaymentInfo, monthlyInfo.Month)

    }

    console.log(result);

    renderLoanEndMsg(result[result.length-1])
    renderLoanBreakup(result) 
}



