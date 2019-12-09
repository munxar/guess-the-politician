const fs = require('fs')
const axios = require('axios')
const api = axios.create({
    baseURL: 'https://ws.parlament.ch/odata.svc'
})
const imageUrl = id => `https://www.parlament.ch/sitecollectionimages/profil/portrait-260/${id}.jpg`
async function init() {
    const res = await api.get(`Person?$filter=Language eq 'DE'&$expand=MembersCouncil/MembersParty`)

    const councillors = res.data.d.results.map(councillor => {
        return {
            ID: councillor.ID,
            FirstName: councillor.FirstName,
            LastName: councillor.LastName,
            GenderAsString: councillor.GenderAsString,            
            PersonIdCode: councillor.PersonIdCode,
            ImageUrl: councillor.PersonIdCode && imageUrl(councillor.PersonIdCode),
            PartyName: councillor.MembersCouncil && councillor.MembersCouncil.MembersParty.results[0] && councillor.MembersCouncil.MembersParty.results[0].PartyName,
        }
    })
    .filter(councillor => councillor.ImageUrl)
    
    const promisses = councillors.map(async councillor => {
        const { ImageUrl } = councillor
        try {
            await axios.get(ImageUrl)
            return councillor
        } catch(err) {
            return null
        }
    })

    const validCouncillors = (await axios.all(promisses)).filter(p => p !== null)

    fs.writeFileSync('councillors.json', JSON.stringify(validCouncillors, null, 2))
}

init()