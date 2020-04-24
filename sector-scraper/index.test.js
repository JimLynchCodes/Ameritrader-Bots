const mongoFunctions = require('./mongo-functions')
const axios = require('axios');

describe('index - sector scraper main file', () => {

    beforeEach(() => {

        // const mockSave = jest.fn().mockReturnValue(() => Promise.resolve('foo'))

        // jest.mock('./mongo-functions', () => {
        //     return jest.fn().mockImplementation(() => {
        //         return { save: mockSave };
        //     });
        // });

        // const mockGet = jest.fn().mockImplementation(() => Promise.resolve('foo'))

        const mock = jest.mock('axios').mockImplementation( () => {
            return Promise.resolve({data: 'der'})
        });

        console.log('the mock', axios.get)

        // axios.get = jest.fn().mockImplementation(() => {

        //     return Promise.resolve({ data: 'foo' })
        // }
        // )

        axios.get.mockImplementation( () => {
            return Promise.resolve({ data: 'foo' })
        })

        // jest.mock('axios', () => {
        //     // return jest.fn().mockImplementation(() => {
        //     //     return { get: () => { return 'foo'} };
        //     // });

        //     return jest.fn.mockImplementation(() => {
        //         get: () => Promise.resolve('foo')
        //     })
        // });

    })


    it('should', async () => {
        const index = require('./index.js')
        expect(true).toBe(true)
    })

})