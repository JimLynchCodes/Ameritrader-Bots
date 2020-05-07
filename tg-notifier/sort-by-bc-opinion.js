const sortByBcOpinion = (a, b) => {
    
    aIsNa = a['BC_Opinion'].slice(-3) === 'N/A'
    bIsNa = b['BC_Opinion'].slice(-3) === 'N/A'

    aIsBuySignal = a['BC_Opinion'].slice(-3) === 'Buy'
    bIsBuySignal = b['BC_Opinion'].slice(-3) === 'Buy'
    
    if (aIsBuySignal && !bIsBuySignal ||
      bIsNa) {
      return -1
    } 
    
    if (!aIsBuySignal && bIsBuySignal || aIsNa) {
      return 1
    }

    if (aIsBuySignal && bIsBuySignal) {
      return parseFloat(a['BC_Opinion']) < parseFloat(b['BC_Opinion']) ? 1 : -1
    }

    return parseFloat(a['BC_Opinion']) > parseFloat(b['BC_Opinion']) ? 1 : -1
  }

  module.exports = sortByBcOpinion