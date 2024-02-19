/**
 * A type representing a message to transmit via the bus.
 * @typedef {Object} Message
 * @property {string} content - the content of the message.
 * @property {string[]} recipients - the names of the subscribers which the message is intended for.
 */

/**
 * A type representing a subscriber's callback function.
 * @name SubscriberCallback
 * @function
 * @param {Message} message
 */

/**
 * A type representing subscribers to a bus.
 * @typedef {Object} Subscriber
 * @property {string} name - the name of the subscriber.
 * @property {SubscriberCallback} callback - the callback of the subscriber.
 */

/**
 * A class representing a bus for publishing, subscribing to and unsubscribing from messages.
 * @class
 */
class Bus {
    constructor() {
        /**
         * @type {Subscriber[]}
         */
        this.subscribers = []
    }

    /**
     * Add the subscriber to the bus.
     * @param {Subscriber} subscriber 
     */
    subscribe(subscriber) {
        this.subscribers = [...this.subscribers, subscriber];
    }

    /**
     * Remove the subscriber from the bus.
     * @param {Subscriber} subscriber 
     */
    unsubscribe(subscriber) {
        this.subscribers = this.subscribers.filter(existingSubscriber => existingSubscriber !== subscriber);
    }

    /**
     * Transmit a message via the bus to all subscribers.
     * @param {Message} message 
     */
    publish(message) {
        const subscribers = this.subscribers.filter(subscriber => message.recipients.indexOf(subscriber.name) > -1);
        console.group(`Publishing to ${subscribers.length} subscribers`);
        console.log(message);
        
        subscribers.forEach(subscriber => subscriber.callback(message));

        console.groupEnd();
    }
}

/**
 * A type representing the data model of the form for adding subscribers.
 * @typedef {Object} SubscriberFormModel
 * @property {string} subscriberName - the name of the subscriber.
 */

/**
 * A type representing the data model of the form for publishing messages.
 * @typedef {Object} PublishMessageFormModel
 * @property {string} message - the message.
 * @property {string} recipients - a comma separated string with the names of the subscribers which the message is intended for.
 */

class FormHandler {
    constructor(bus) {
        if(!bus) {
            throw "Parameter 'bus' is mandatory"
        }

        /**
         * @type {Bus}
         */
        this.bus = bus;
    }

    /**
     * @returns {HTMLTableElement}
     */
    getSubscriberTable() {
        return document.getElementById('subscriberTable').getElementsByTagName('tbody')[0];
    }

    /**
     * The callback function to use when adding a subscriber to the bus.
     * @param {Message} message 
     */
    subscriberCallback(message) {
        console.group('Received callback');
        console.log(message);

        const subscriberTable = this.getSubscriberTable();
                
        /**
         * @type {HTMLTableRowElement[]}
         */
        const subscriberRows = subscriberTable.rows;

        console.log(`The subscriber table has ${subscriberRows.length} rows.`);
        
        /**
         * @type {HTMLTableRowElement[]}
         */
        const targetRows = [...subscriberRows].filter(
            /**
             * @param {HTMLTableRowElement} row 
             */
            function (row) {
                const subscriberName = row.cells[0].textContent;
                const isRelevant =  message.recipients.indexOf(subscriberName) > -1;
                if(isRelevant) {
                    console.log(row);
                }
                return isRelevant;
            });

        if(!targetRows) {
            console.error(`Unable to find row for subscribers ${message.recipients}`);
        }
        
        targetRows.forEach(
            /**
             * @param {HTMLTableRowElement} targetRow 
             */
            function (targetRow) {
                const messageCell = targetRow.cells[1];
                if(!messageCell.textContent) {
                    console.log('Adding text node to message cell.');
                    messageCell.appendChild(document.createTextNode(''));
                }
                console.log(`Setting content of message cell text node: ${message.content}`);
                messageCell.textContent = message.content;
            });

        console.groupEnd();
    }

    /**
     * @param {SubmitEvent} submitEvent 
     */
    onSubscriberFormSubmit(submitEvent) {
        submitEvent.preventDefault();

        /**
         * @type {SubscriberFormModel}
         */
        const formData = Object.fromEntries(new FormData(submitEvent.target));

        console.group('Submitting subscriber');
        console.log(formData);
        console.groupEnd();

        let self = this;

        this.bus.subscribe({
            name: formData.subscriberName,
            callback: function (message) {
                self.subscriberCallback(message);
            }
        });

        const newRow = self.getSubscriberTable().insertRow();
        const newNameCell = newRow.insertCell();
        const newName = document.createTextNode(formData.subscriberName);
        newNameCell.appendChild(newName);

        const newMessageCell = newRow.insertCell();
    }

    /**
     * 
     * @param {SubmitEvent} submitEvent 
     */
    onPublishMessageFormSubmit(submitEvent) {
        submitEvent.preventDefault();

        /**
         * @type {PublishMessageFormModel}
         */
        const formData = Object.fromEntries(new FormData(submitEvent.target));

        this.bus.publish({
            content: formData.message,
            recipients: formData.recipients.split(',')
        });
    }

    setupEvents() {
        let self = this;

        document.getElementById('addSubscriberForm').addEventListener(
            'submit',
            /**
             * @param {SubmitEvent} submitEvent 
             */
            function (submitEvent) {
                self.onSubscriberFormSubmit(submitEvent)
            });

        document.getElementById('publishMessageForm').addEventListener(
            'submit',
            /**
             * @param {SubmitEvent} submitEvent 
             */
            function (submitEvent) {
                self.onPublishMessageFormSubmit(submitEvent);
            });
    }
}

const bus = new Bus();
const formHandler = new FormHandler(bus);

formHandler.setupEvents();