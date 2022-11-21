const initialState = {
  loading: false,
  totalSupply: 0,
  error: false,
  errorMsg: '',
}

const dataReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'CHECK_DATA_REQUEST':
      return {
        ...state,
        loading: true,
        error: false,
        errorMsg: '',
      }
    case 'CHECK_DATA_SUCCESS':
      return {
        ...state,
        loading: false,
        totalSupply: action.payload.totalSupply,
        cost: action.payload.cost,
        displayCost: action.payload.display_cost,
        presale: action.payload.presale,
        mintable: action.payload.mintable,
        mintedCount: action.payload.mintedCount,
        error: false,
        errorMsg: '',
      }
    case 'CHECK_DATA_FAILED':
      return {
        ...initialState,
        loading: false,
        error: true,
        errorMsg: action.payload,
      }
    default:
      return state
  }
}

export default dataReducer
