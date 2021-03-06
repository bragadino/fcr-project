const yargs = require('yargs')
const web3 = require('./web3')
const config = require('../../fcr-config/config.json')

// TODO add config to the CLI to switch envs (local, ropsten, etc)
const fcr = require('../../fcr-js/src')(web3, config.local)

yargs
  .command(
    'apply <listingHash> <amount> [data]',
    'submit a listing application to the registry',
    {
      listingHash: {
        require: true
      },
      amount: {
        require: true,
        number: true
      },
      data: {
        default: ''
      },
      from: {
        default: '0',
        number: true
      }
    },
    async (argv) => {
      const applicant = await getFromAddress(argv.from)
      const amount = tryParseIntParam('amount', argv.amount)

      console.log('')
      console.log(`sending 'apply' transaction:`)
      console.log(`  listingHash: ${argv.listingHash}`)
      console.log(`  amount: ${amount}`)
      console.log(`  data: ${argv.data}`)
      console.log(`  applicant (sender): ${applicant}`)
      console.log('')

      const tx = await fcr.registry.apply(applicant, argv.listingHash, amount, argv.data)
      console.log(tx)
      console.log('')
    }
  )

  .command({
    command: 'registryName',
    desc: 'get the name of the registry',
    handler: async () => {
      const name = await fcr.registry.name()
      console.log(name)
    }
  })

  .command(
    'tokenBalance <address>',
    'gets the amount of FCR token held by the given address',
    {
      address: {
        required: true
      }
    },
    async (argv) => {
      const address = await getAccountByIndex(argv.address)
      const balance = await fcr.token.getBalance(address)
      console.log(`${address}: ${balance}`)
    }
  )

  .command(
    'registryAllowance <address>',
    'gets the amount of token the registry contract can spend on behalf of the given address',
    {
      address: {
        required: true
      }
    },
    async (argv) => {
      const owner = await getAccountByIndex(argv.address)
      const spender = fcr.registry.address
      const allowance = await fcr.token.getAllowance(owner, spender)
      console.log(`${owner}: ${allowance}`)
    }
  )

  .help()
  .argv

async function getFromAddress (fromParamValue) {
  const fromAccountIndex = tryParseIntParam('from', fromParamValue)
  const address = await getAccountByIndex(fromAccountIndex)
  return address
}

async function getAccountByIndex (indexOrAddress) {
  const accounts = await web3.eth.getAccounts()

  // check if given param is an address or an index
  const address = parseInt(indexOrAddress) > 10 ** 18 ? 
    indexOrAddress : accounts[indexOrAddress]

  return address
}

function tryParseIntParam (paramName, intString) {
  const int = parseInt(intString)
  if (isNaN(int)) {
    throw new Error(`value for '${paramName}' is not a number`)
  }
  return int
}
