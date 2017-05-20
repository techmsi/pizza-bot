const pizzapi = require('dominos');
const { red, green } = require('chalk');
const DEFAULT_ADDRESS = '11 Times Square, New York, NY 10036';

const clean = s => s.replace('\n', ' ').replace(/ID IS REQUIRED FOR ALL CREDIT CARD(S)? ORDERS./, '');
const printStore = ({ StoreID, AddressDescription }) => `${StoreID}: ${clean(AddressDescription)}`;
const printStores = () => `Nearby Stores ... {{#vars.stores}}\r\n {{.}} {{/vars.stores}}`;
const printStoreInfo = () => `Store ({{ vars.storeId }})\n{{#vars.info}} Call: {{Phone}} {{/vars.info}}`;
const printStoreMenu = () => `Menu for {{ vars.storeId }}\n{{#vars.menu}}\r\n {{id}} - {{item}}\r\n {{/vars.menu}}`;
// 3) setup menu
const setUpMenuConvo = (convo) => {
  convo.addMessage({text: printStoreInfo(), action: `store-menu`}, `store-info`);
  convo.addMessage(printStoreMenu(), `store-menu`);
};

const setUpStoresConvo = (convo) => {
  convo.addMessage({
    text: printStores(),
    action: `pick-store`
  }, `list-stores`);

  // Choose a store
  convo.addQuestion(`\nEnter the **store ID** would you like to order from:\n`, (response) => {
    const storeId = parseInt(response.text, 10);
    console.log('storeId ', red(storeId));
    convo.setVar(`storeId`, storeId);

    const myStore = new pizzapi.Store({ID: storeId});
    myStore.getFriendlyNames(
      (storeData) => {
        var store = storeData.result.map((o, k) => ({ id: o[k], item: Object.keys(o) }));
        convo.setVar(`menu`, store.slice(0, 3));
        console.log('storeData ', red(JSON.stringify(store[0], null, 2)));
        console.log('Menu items ', red(store.length));
      }
    );

    myStore.getInfo((storeData) => {
      convo.setVar(`info`, storeData.result);
      console.log(`INFO - ${green(storeId)}: ${red(storeData.result.Phone)}`);
    });
    convo.gotoThread(`store-info`);
    // convo.gotoThread(`store-menu`);
  }, {}, `pick-store`);
};

const getStores = (address, cb) => pizzapi.Util.findNearbyStores(address, `Delivery`, (storeData) => {
  console.log(red('storeData.success '), storeData.success);

  if (!storeData.success) {
    return cb(new Error(storeData.message));
  }
  const stores = storeData.result.Stores.map(printStore);

  cb(null, stores);
});

const handleErrors = (convo) => {
  convo.addMessage({
    text: `I couldn't find a store with ID {{ vars.storeId }}. Double check that ID with the list above.`,
    action: `pick-store`
  }, `store-dne`);

  convo.addMessage({
    text: `Oops! No pizza stores. Try again.`,
    action: `address`
  }, `address_error`);

  convo.addMessage(`Oh dear, I couldn't find any stores near you.`, `no_stores`);
};

// 2) setup address
const setUpAddressConvo = (convo) => {
  let address = null;

  convo.addQuestion('Please enter your full address.', (response) => {
    address = response.text || DEFAULT_ADDRESS;
    // Find stores
    getStores(address, (err, stores) => {
      if (err) { convo.gotoThread(`address_error`); return; }

      console.log(red('stores.length '), stores.length);

      if (stores.length === 0) { convo.gotoThread(`no_stores`); return; }

      convo.setVar(`address`, address);
      convo.setVar(`stores`, stores);

      convo.gotoThread(`list-stores`);
    });
  },
  {},
  'received_address');
};

// 1) setup
const setUpConvo = (err, convo) => {
  if (err) console.error(err);

  handleErrors(convo);
  setUpAddressConvo(convo);
  setUpStoresConvo(convo);
  setUpMenuConvo(convo);

  convo.activate();
  convo.gotoThread('received_address');
};

module.exports = {
  init: (controller) => {
    controller.hears([/pizza/i], ['ambient', 'direct_message'],
      (bot, message) => bot.createConversation(message, setUpConvo));
  },
  help: {
    command: 'I want pizza',
    text: `Say "I want pizza" and I'll begin to search for stores.`
  }
};
