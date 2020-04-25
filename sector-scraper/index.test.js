const mongoFunctions = require('./mongo-functions')
const axios = require('axios');

describe('index - sector scraper main file', () => {

    let mockGet
    let mockSave
    let mockMoment

    beforeEach(() => {

        mockGet = jest.fn(() => Promise.resolve({ 'data': 'foo' }))

        jest.mock('axios', () => {
            return {
                get: mockGet
            }
        })

        jest.mock('moment', () => {
            return () => {
                return {
                    format: () => (new Date())
                }
            }
        })

        mockSave = jest.fn(() => Promise.resolve({ 'data': 'saved!' }))

        jest.mock('./mongo-functions', () => {
            return {
                save: mockSave
            }
        })

    })


    it('should take the response from Alphavantage and insert it into Mongo', async () => {

        const index = require('./index.js')

        expect(mockGet).toHaveBeenCalledTimes(1)
        expect(mockGet).toHaveBeenCalledWith(process.env.ALPHAVANTAGE_SECTORS_ENDPOINT)

        expect(mockSave).toHaveBeenCalledTimes(1)
        expect(mockSave).toHaveBeenCalledWith({'foo': 'bar'})



    })

})