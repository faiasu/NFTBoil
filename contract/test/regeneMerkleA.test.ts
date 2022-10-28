/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-unused-expressions */
import { ethers, waffle } from 'hardhat'
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { testConfigRegene as testConfig } from './test-helpers'
import type { RegeneMerkleA as regeneMerkleA } from '../typechain-types'
import type { BigNumber, BytesLike } from 'ethers'
import { expect } from 'chai'
import { MerkleTree } from 'merkletreejs'
import keccak256 from 'keccak256'

describe(`regeneMerkleA contract`, function () {
  let owner: SignerWithAddress
  let bob: SignerWithAddress
  let bobs: regeneMerkleA
  let alis: SignerWithAddress
  let ads: regeneMerkleA
  let ad: regeneMerkleA
  let mintCount = 0

  beforeEach(async function () {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    [owner, bob, alis] = await ethers.getSigners()
    const contract = await ethers.getContractFactory('regeneMerkleA')
    ad = (await contract.deploy(
      'regeneMerkleA',
      testConfig.symbol
    )) as regeneMerkleA
    await ad.deployed()
    bobs = ad.connect(bob)
    ads = ad.connect(alis)

    // Ensure contract is paused/disabled on deployment
    expect(await ad.mintable()).to.equal(true)
  })

  describe('Basic checks', function () {
    it('check the owner', async function () {
      expect(await ad.owner()).to.equal(owner.address)
    })

    it('Confirm pre price', async function () {
      const cost = ethers.utils.parseUnits(testConfig.price.toString(), 'ether')
      expect(await ad.getSalePrice()).to.equal(cost)
    })
  })

  describe('Mint checks', function () {
    let rootTree
    let hexProofs: BytesLike[][]
    let mintCost: BigNumber
    beforeEach(async function () {
      mintCost = await ad.getSalePrice()
      const leaves = [alis.address].map((x) => keccak256(x))
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })
      rootTree = tree.getRoot()
      await ad.setMerkleRoot(rootTree)
      hexProofs = [owner.address, bob.address, alis.address].map((x) => {
        return tree.getHexProof(keccak256(x))
      })
    })
    it('Non WhiteList Address cant Mint', async function () {
      await expect(
        ad.connect(bob).Mint(bob.address, hexProofs[1]!, {
          value: mintCost,
        })
      ).to.be.revertedWith('Invalid Merkle Proof')

      await expect(
        ad.connect(owner).Mint(owner.address, hexProofs[0]!, {
          value: mintCost,
        })
      ).to.be.revertedWith('Invalid Merkle Proof')
    })
    it('WhiteListed Address can Mint', async function () {
      expect(
        await ad
          .connect(bob)
          .Mint(alis.address, hexProofs[2]!, { value: mintCost })
      ).to.ok
      expect(
        await ad
          .connect(owner)
          .Mint(alis.address, hexProofs[2]!, { value: mintCost })
      ).to.ok
      expect(
        await ad
          .connect(alis)
          .Mint(alis.address, hexProofs[2]!, { value: mintCost })
      ).to.ok
      mintCount += 3
    })

    it('Mint Stop Mintable: paused', async function () {
      await ad.setMintable(false)
      await expect(
        ad.connect(bob).Mint(alis.address, hexProofs[2]!, { value: mintCost })
      ).to.be.revertedWith('Mintable: paused')
    })

    it('Whitelisted fails to mints when paused', async () => {
      await ad.pause()

      await expect(
        ad.connect(alis).Mint(alis.address, hexProofs[2]!, {
          value: mintCost,
        })
      ).to.revertedWith('Pausable: paused')
      await ad.unpause()
      expect(await ads.Mint(alis.address, hexProofs[2]!, { value: mintCost }))
        .to.ok
      mintCount++
    })

    it('Non WhiteList user block after Whitelisted user buy', async function () {
      expect(await ads.Mint(alis.address, hexProofs[2]!, { value: mintCost }))
        .to.ok
      mintCount++
      await expect(
        ad.connect(bob).Mint(bob.address, hexProofs[2]!, { value: mintCost })
      ).to.be.revertedWith('Invalid Merkle Proof')
    })

    it('Pre Sale Price Boundary Check', async () => {
      const cost = ethers.utils.parseUnits(testConfig.price.toString(), 'ether')
      expect(await ads.Mint(alis.address, hexProofs[2]!, { value: cost })).to.ok
      mintCount++
      expect(
        await ads.Mint(alis.address, hexProofs[2]!, { value: cost.add(1) })
      ).to.ok
      mintCount++
      await expect(
        ad
          .connect(alis)
          .Mint(alis.address, hexProofs[2]!, { value: cost.sub(1) })
      ).to.revertedWith('Not enough funds')
    })

    it('Pre Sale setPrice Check', async () => {
      const cost = ethers.utils.parseUnits('0.001')
      expect(await ad.setMintCost(cost))
      expect(await ads.Mint(alis.address, hexProofs[2]!, { value: cost })).to.ok
      mintCount++
      expect(
        await ads.Mint(alis.address, hexProofs[2]!, { value: cost.add(1) })
      ).to.ok
      mintCount++
      await expect(
        ads.Mint(alis.address, hexProofs[2]!, { value: cost.sub(1) })
      ).to.revertedWith('Not enough funds')
    })
  })
})
