import { Handler } from '@netlify/functions'
import keccak256 from 'keccak256'
import { MerkleTree } from 'merkletreejs'

export const handler: Handler = async (event, context) => {
  const address = event.queryStringParameters?.address
  if (!address) {
    return { statusCode: 400, body: 'Set address on API' }
  }
  const addressesLower = addresses.map((x) => x.toLowerCase())
  const addressLower = address.toLowerCase()

  const leafNodes = addressesLower.map((x) => keccak256(x))
  const tree = new MerkleTree(leafNodes, keccak256, { sortPairs: true })
  const nodeIndex: number = addressesLower.indexOf(addressLower)
  const rootHash = tree.getRoot()
  console.log('rootHash:', tree.getHexRoot())

  console.log('address:', addressLower, 'nodeindex:', nodeIndex)

  if (nodeIndex === -1) {
    return { statusCode: 400, body: "Your Address don't eligible whitelist" }
  }
  const hashedAddress = keccak256(addressLower)
  const hexProof = tree.getHexProof(hashedAddress)
  const verify = tree.verify(hexProof, hashedAddress, rootHash)

  if (!verify) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        address,
        message: 'your address can not verify',
      }),
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      hexProof,
    }),
  }
}
const addresses = [
  '0x27eD0dB22AC700548c3A654cA59c05d2c9A72583',
  '0xBACD554F82690B080D9ED06f6774321bD7f38E84',
  '0xe255D4D1097B84b0e524C3cd38A6D6E6Bb2986a7',
]
