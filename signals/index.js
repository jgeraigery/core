import attempt from 'lodash/attempt';
import isEmpty from 'lodash/isEmpty';

const readonly = (get) => ({ get, enumerable: true });

/**
 * Provides utilities for synchronizing blocks of code.
 *
 * There are 4 types of signals provided in this module:
 *
 * **Manual Reset Signal**
 *
 * Think of the manual reset signal as a traffic light. While it is red,
 * all cars are queued in the order they arrive. Once the light is signaled
 * green, the cars can proceed in the order they arrived. And as long as the
 * light remains green, any future cars can proceed.
 *
 * Use cases:
 *
 * - wait for a router to bootstrap before enabling navigation
 * - block all load operations until a save operation completes
 *
 * **Auto Reset Signal**
 *
 * The auto reset signal can be used to create a `critical section` -- i.e. a
 * block of code that can only be executed by 1 caller at a time. Every other
 * caller will be queued in the order they arrive, and the next caller in the
 * queue will only be allowed to enter the critical section when the previous
 * caller leaves the critical section.
 *
 * Use cases:
 *
 * - ensure only 1 dialog is shown to the user at a time
 * - queue router navigations while a navigation is in process
 * - ensure a specific network call completes before being called again
 *
 * **Countdown Signal**
 *
 * A countdown signal allows you to queue callers until a certain number of
 * operations have completed.
 *
 * Use cases:
 *
 * - disable the UI until a group of downloads have finished
 * - wait for a set of child components to load before stopping a timer
 *
 * **Semaphore**
 *
 * Think of a semaphore as a bouncer at a club who ensures that only a certain
 * number of people are allowed in at one time. In other words, semaphores are
 * used to control access to a limited pool of resources.
 *
 * Use cases:
 *
 * - limit file uploads to a maximum of 5 at a time
 * - limit in-progress data calls on a slow network
 *
 * @module signals
 */

/**
 * Queues all callers until signaled. Once signaled, all callers proceed in the
 * order they were queued. Future callers will proceed immediately while this
 * object remains in a signaled state.
 *
 * Think of the manual reset signal as a traffic light. While it is red, all cars
 * are queued in the order they arrive. Once the light is signaled green, the cars
 * can proceed in the order they arrived. And as long as the light remains green,
 * any future cars can proceed.
 *
 * @interface ManualResetSignal
 * @example
 * import { manualReset } from '@paychex/core/signals';
 *
 * const signal = manualReset();
 *
 * export function bootstrap() {
 *   // do some preliminary stuff
 *   signal.set(); // unblock any callers
 * }
 *
 * export async function doSomething() {
 *   // block callers until signaled:
 *   await signal.ready();
 *   // bootstrap has now been called and
 *   // completed, so we can safely perform
 *   // an operation here
 * }
 * @example
 * // simple pause/resume functionality
 *
 * import { manualReset } from '@paychex/core/signals';
 *
 * const signal = manualReset(true); // start unblocked
 *
 * export async function doSomething() {
 *   await signal.ready();
 *   // do stuff here
 * }
 *
 * export function pause() {
 *   signal.reset();
 * }
 *
 * export function resume() {
 *   signal.set();
 * }
 */

/**
 * Places the signal into a signaled state. This invokes any queued callers
 * in the order they were queued and allows future callers to proceed immediately.
 *
 * @function module:signals~ManualResetSignal#set
 * @example
 * import { manualReset } from '@paychex/core/signals';
 * import { rethrow, ignore } from '@paychex/core/errors';
 * import { tracker } from '../path/to/tracker';
 *
 * const signal = manualReset(); // starts blocked
 *
 * export async function bootstrap() {
 *   // do bootstrap stuff here
 *   signal.set(); // unblock the signal
 * }
 *
 * export function onReady(callback) {
 *   signal.ready() // block until signaled
 *     .then(callback)
 *     .catch(rethrow(ignore()))
 *     .catch(tracker.error);
 * }
 */

/**
 * Places the signal into a blocked (unsignaled) state. This begins queueing
 * any future callers.
 *
 * @function module:signals~ManualResetSignal#reset
 * @example
 * // simple pause/resume functionality
 *
 * import { manualReset } from '@paychex/core/signals';
 *
 * const signal = manualReset(true); // start unblocked
 *
 * export async function doSomething() {
 *   await signal.ready();
 *   // do stuff here
 * }
 *
 * export function pause() {
 *   signal.reset();
 * }
 *
 * export function resume() {
 *   signal.set();
 * }
 */

/**
 * Queues the caller until the signal is placed into a signaled state.
 *
 * @function module:signals~ManualResetSignal#ready
 * @returns {Promise} A Promise that will be resolved when the signal is placed
 * into a signaled state.
 * @example
 * import { manualReset } from '@paychex/core/signals';
 * import { rethrow, ignore } from '@paychex/core/errors';
 * import { tracker } from '../path/to/tracker';
 *
 * const signal = manualReset(); // starts blocked
 *
 * export async function bootstrap() {
 *   // do bootstrap stuff here
 *   signal.set(); // unblock the signal
 * }
 *
 * export function onReady(callback) {
 *   signal.ready() // block until signaled
 *     .then(callback)
 *     .catch(rethrow(ignore()))
 *     .catch(tracker.error);
 * }
 */

/**
 * Creates a signal that queues callers until signaled. While signaled, resolves
 * all callers in the order they were queued.
 *
 * Think of a manual reset signal as a traffic light. While it is red, all cars
 * are queued in the order they arrive. Once the light is signaled green, the cars
 * can proceed in the order they arrived. And as long as the light remains green,
 * any future cars can proceed.
 *
 * @function
 * @param {boolean} [signaled=false] Whether to start in a signaled state.
 * @returns {module:signals~ManualResetSignal} A signal that resolves all callers while signaled.
 * @example
 * import { manualReset } from '@paychex/core/signals';
 *
 * const signal = manualReset();
 *
 * export function bootstrap() {
 *   // do some preliminary stuff
 *   signal.set(); // unblock any callers
 * }
 *
 * export async function doSomething() {
 *   // block callers until signaled:
 *   await signal.ready();
 *   // bootstrap has now been called and
 *   // completed, so we can safely perform
 *   // an operation here
 * }
 * @example
 * // simple pause/resume functionality
 *
 * import { manualReset } from '@paychex/core/signals';
 *
 * const signal = manualReset(true); // start unblocked
 *
 * export async function doSomething() {
 *   await signal.ready();
 *   // do stuff here
 * }
 *
 * export function pause() {
 *   signal.reset();
 * }
 *
 * export function resume() {
 *   signal.set();
 * }
 */
export function manualReset(signaled = false) {

    const queue = [];
    let active = signaled;

    function enqueueIfNeeded(resolve) {
        if (active) resolve();
        else queue.push(resolve);
    }

    function ready() {
        return new Promise(enqueueIfNeeded);
    }

    function reset() {
        active = false;
    }

    function set() {
        active = true;
        while (!isEmpty(queue))
            queue.shift()();
    }

    return {
        ready,
        reset,
        set,
    };

}

/**
 * Releases 1 queued caller each time it is signaled.
 *
 * The auto reset signal can be used to create a `critical section` -- i.e. a block
 * of code that can only be executed by 1 caller at a time. Every other caller will
 * be queued in the order they arrive, and the next caller in the queue will only
 * be allowed to enter the critical section when the previous caller leaves the
 * critical section.
 *
 * @interface AutoResetSignal
 * @example
 * import { autoReset } from '@paychex/core/signals';
 * import { fetch, createRequest } from '../path/to/datalayer';
 *
 * const signal = autoReset(true); // start unblocked
 * const operation = {
 *   method: 'POST',
 *   base: 'my-app',
 *   path: '/some/endpoint'
 * };
 *
 * // ensure each network call completes
 * // before the next call is performed:
 * export async function networkCall() {
 *   await signal.ready(); // blocks other callers
 *   try {
 *     const data = { ... }; // payload to POST to the endpoint
 *     const request = createRequest(operation, null, data);
 *     const response = await fetch(request);
 *     return response.data;
 *   } finally {
 *     signal.set(); // unblock the next caller
 *   }
 * }
 */

/**
 * Places the signal into a signaled state. This will release only 1 queued caller
 * and then immediately reset the signal.
 *
 * @function module:signals~AutoResetSignal#set
 * @example
 * import { autoReset } from '@paychex/core/signals';
 *
 * const signal = autoReset(true); // start unblocked
 *
 * export async function doSomething() {
 *   await signal.ready(); // blocks other callers
 *   try {
 *     // critical section here
 *   } finally {
 *     signal.set(); // unblock the signal so the next caller can proceed
 *   }
 * }
 */

/**
 * Places the signal into a blocked (unsignaled) state. This begins queueing
 * any future callers.
 *
 * **NOTE:** You often won't need to call this method directly since this
 * signal will reset automatically each time it is set.
 *
 * @function module:signals~AutoResetSignal#reset
 * @example
 * import { autoReset } from '@paychex/core/signals';
 *
 * const signal = autoReset(true); // start unblocked
 *
 * export async function doSomething() {
 *   await signal.ready();
 *   // do stuff here
 *   signal.set();
 * }
 *
 * export function cancel() {
 *   // this perpetually blocks the signal
 *   // unless set() gets called again
 *   signal.reset();
 * }
 */

/**
 * Queues the caller until the signal is placed into a signaled state.
 *
 * @function module:signals~AutoResetSignal#ready
 * @returns {Promise} A Promise that will be resolved when the signal is placed
 * into a signaled state.
 * @example
 * import { autoReset } from '@paychex/core/signals';
 *
 * const signal = autoReset(true); // start unblocked
 *
 * export async function doSomething() {
 *   await signal.ready(); // blocks other callers
 *   try {
 *     // critical section here
 *   } finally {
 *     signal.set(); // unblock the signal so the next caller can proceed
 *   }
 * }
 */

/**
 * Creates a signal that queues callers until signaled. Releases only 1 queued
 * caller each time it is signaled, then automatically resets into a blocked state.
 *
 * The auto reset signal can be used to create a `critical section` -- i.e. a block
 * of code that can only be executed by 1 caller at a time. Every other caller will
 * be queued in the order they arrive, and the next caller in the queue will only
 * be allowed to enter the critical section when the previous caller leaves the
 * critical section.
 *
 * @function
 * @param {boolean} [signaled=false]
 * @returns {module:signals~AutoResetSignal} A signal that releases 1 caller each time it is signaled.
 * @example
 * import { autoReset } from '@paychex/core/signals';
 * import { fetch, createRequest } from '../path/to/datalayer';
 *
 * const signal = autoReset(true); // start unblocked
 * const operation = {
 *   method: 'POST',
 *   base: 'my-app',
 *   path: '/some/endpoint'
 * };
 *
 * // ensure each network call completes
 * // before the next call is performed:
 * export async function networkCall() {
 *   await signal.ready(); // block other callers
 *   try {
 *     const data = { ... }; // payload to POST to the endpoint
 *     const request = createRequest(operation, null, data);
 *     const response = await fetch(request);
 *     return response.data;
 *   } finally {
 *     signal.set(); // unblock the next caller
 *   }
 * }
 */
export function autoReset(signaled = false) {

    const queue = [];
    let active = signaled;

    function enqueueIfNeeded(resolve) {
        if (active) {
            reset();
            resolve();
        } else {
            queue.push(resolve);
        }
    }

    function reset() {
        active = false;
    }

    function ready() {
        return new Promise(enqueueIfNeeded);
    }

    function set() {
        if (!isEmpty(queue))
            queue.shift()();
        else
            active = true;
    }

    return {
        ready,
        reset,
        set,
    };

}

/**
 * Queues callers until the counter reaches 0.
 *
 * @interface CountdownSignal
 * @example
 * import { countdown } from '@paychex/core/signals';
 *
 * export function downloadAll(files = []) {
 *   const signal = countdown(files.length);
 *   files.forEach(file =>
 *     download(file).finally(() =>
 *       signal.decrement()));
 *   return signal.ready();
 * }
 * @example
 * import { countdown } from '@paychex/core/signals';
 * import { registry } from '../some/component/registry';
 *
 * const signal = countdown();
 *
 * export function loadComponent(component) {
 *   if (component in registry) {
 *     signal.increment();
 *     const script = document.createElement('script');
 *     script.async = true;
 *     script.type = 'text/javascript';
 *     script.src = registry[component];
 *     script.onload = () => signal.decrement(); // countdown
 *     document.body.appendChild(script);
 *   }
 *   return signal.ready();
 * }
 */

/**
 * Places the signal into a blocked state. The signal will need to be decremented
 * by a corresponding amount in order to unblock it.
 *
 * @function module:signals~CountdownSignal#increment
 * @param {number} [count=1] The number to add to the internal counter. Must be a positive integer.
 * @example
 * import { countdown } from '@paychex/core/signals';
 *
 * const signal = countdown();
 *
 * export function appendFilesToDownload(files = []) {
 *   signal.increment(files.length);
 *   files.forEach(file =>
 *     download(file).finally(() =>
 *       signal.decrement()));
 *   return signal.ready();
 * }
 */

/**
 * Subtracts the specified amount from the counter. When the counter reaches 0 it
 * will be placed into an unblocked state, enabling any queued callers to proceed.
 *
 * @function module:signals~CountdownSignal#decrement
 * @param {number} [count=1] The number to subtract from the internal counter. Must be a positive integer.
 * @example
 * import { countdown } from '@paychex/core/signals';
 *
 * const signal = countdown(3);
 *
 * async function doTask1() {
 *   // do stuff
 *   signal.decrement();
 * }
 *
 * async function doTask2() {
 *   // do stuff
 *   signal.decrement();
 * }
 *
 * async function doTask3() {
 *   // do stuff
 *   signal.decrement();
 * }
 *
 * doTask1();
 * doTask2();
 * doTask3();
 *
 * export function ready() {
 *   return signal.ready();
 * }
 */

/**
 * Queues the caller until the counter reaches 0. Once the counter reaches 0, all
 * callers will be invoked in the order they were queued.
 *
 * @function module:signals~CountdownSignal#ready
 * @returns {Promise} A Promise that will be resolved when the counter reaches 0.
 * @example
 * import { countdown } from '@paychex/core/signals';
 *
 * export function downloadAll(files = []) {
 *   const signal = countdown(files.length);
 *   files.forEach(file =>
 *     download(file).finally(() =>
 *       signal.decrement()));
 *   return signal.ready();
 * }
 */

/**
 * Creates a signal that will queue callers until the counter reaches 0. At that
 * point, all callers will be invoked in the order they were queued.
 *
 * @function
 * @param {number} [initialCount=0] The initial count of the signal. Must be a non-negative integer.
 * @returns {module:signals~CountdownSignal} Queues callers until the counter reaches 0.
 * @example
 * import { countdown } from '@paychex/core/signals';
 *
 * export function downloadAll(files = []) {
 *   const signal = countdown(files.length);
 *   files.forEach(file =>
 *     download(file).finally(() =>
 *       signal.decrement()));
 *   return signal.ready();
 * }
 * @example
 * // progress blocking
 *
 * import { countdown } from '@paychex/core/signals';
 *
 * const counter = countdown();
 *
 * export function addBlockingTask(task) {
 *   counter.increment();
 *   return Promise.resolve()
 *     .then(task)
 *     .finally(counter.decrement);
 * }
 *
 * export function tasksCompleted() {
 *   return counter.ready();
 * }
 */
export function countdown(initialCount = 0) {

    let counter = Math.max(0, Math.floor(initialCount));
    const inner = manualReset(counter === 0);

    function increment(count = 1) {
        counter += Math.max(1, Math.floor(count));
        inner.reset();
    }

    function decrement(count = 1) {
        const amount = Math.max(1, Math.floor(count));
        counter = Math.max(0, counter - amount);
        if (counter === 0)
            inner.set();
    }

    function ready() {
        return inner.ready();
    }

    return {
        ready,
        increment,
        decrement,
    };

}

/**
 * Limits access to a pool of resources by restricting how many callers can run at a time.
 * Any callers above the allowed amount will be queued until a spot is released.
 *
 * **Best Practices**
 *
 * - Whether your operation succeeds or fails, _always_ call {@link module:signals~Semaphore#release release()}
 * to ensure the next caller can proceed. Calling `release()` inside a `finally` block makes this easy.
 * See the example below.
 *
 * @interface Semaphore
 * @example
 * import { semaphore } from '@paychex/core/signals';
 * import { fetch, createRequest } from '~/path/to/datalayer';
 * import { tracker } from '~/path/to/tracker';
 *
 * const uploadSpots = semaphore(5);
 * const operation = {
 *   base: 'files',
 *   method: 'POST',
 *   path: '/save/:id'
 * };
 *
 * export async function uploadFile(blob) {
 *   const data = new FormData();
 *   const params = { id: tracker.uuid() };
 *   data.append('file', blob, params.id);
 *   try {
 *     await uploadSpots.ready();
 *     await fetch(createRequest(operation, params, data));
 *     return params.id;
 *   } finally {
 *     uploadSpots.release(); // always release
 *   }
 * }
 */

/**
 * The number of spots currently available for callers before they will be queued.
 *
 * @member module:signals~Semaphore#available
 * @type {number}
 * @example
 * import { semaphore } from '@paychex/core/signals';
 *
 * const spots = semaphore(10);
 *
 * spots.ready().then(doSomething).finally(spots.release);
 *
 * console.log(spots.queued); // 0
 * console.log(spots.running); // 1
 * console.log(spots.available); // 9
 */

/**
 * The number of callers currently running. Callers must always remember to call
 * {@link module:signals~Semaphore#release release()} when done to ensure this number
 * is decremented appropriately.
 *
 * @member module:signals~Semaphore#running
 * @type {number}
 * @example
 * import { semaphore } from '@paychex/core/signals';
 *
 * const spots = semaphore(10);
 *
 * spots.ready().then(doSomething).finally(spots.release);
 *
 * console.log(spots.queued); // 0
 * console.log(spots.running); // 1
 * console.log(spots.available); // 9
 */

/**
 * The number of callers that are still waiting to run.
 *
 * @member module:signals~Semaphore#queued
 * @type {number}
 * @example
 * import { semaphore } from '@paychex/core/signals';
 *
 * const spots = semaphore(2);
 *
 * spots.ready().then(doSomething).finally(spots.release);
 * spots.ready().then(doSomethingElse).finally(spots.release);
 * spots.ready().then(doAnotherThing).finally(spots.release);
 *
 * console.log(spots.queued); // 1
 * console.log(spots.running); // 2
 * console.log(spots.available); // 0
 */

/**
 * Notifies the semaphore that the given number of slots have become available.
 * If any callers have been queued, they will be run in the newly available slots.
 *
 * @function module:signals~Semaphore#release
 * @param {number} [count=1] The number to spots to make available.
 * @example
 * import { semaphore } from '@paychex/core/signals';
 *
 * const spots = semaphore(2);
 *
 * spots.ready()
 *   .then(doSomething)
 *   .finally(spots.release);
 * @example
 * import { semaphore } from '@paychex/core/signals';
 *
 * const spots = semaphore();
 *
 * Promise.all([
 *   spots.ready().then(firstOperation),
 *   spots.ready().then(secondOperation)
 * ]).finally(() => spots.release(2));
 * @example
 * import { semaphore } from '@paychex/core/signals';
 *
 * const spots = semaphore(10);
 *
 * export async function doSomething() {
 *   await spots.ready();
 *   try {
 *     // code
 *   } finally {
 *     spots.release();
 *   }
 * }
 */

/**
 * Queues the caller until a spot is available.
 *
 * @function module:signals~Semaphore#ready
 * @returns {Promise} A Promise that will be resolved when a slot is available.
 * @example
 * import { semaphore } from '@paychex/core/signals';
 *
 * const spots = semaphore(2);
 *
 * export async function doSomething() {
 *   await spots.ready();
 *   try {
 *     // do stuff
 *   } finally {
 *     spots.release();
 *   }
 * }
 */

/**
 * Limits access to a pool of resources by restricting how many callers can run at a time.
 * Any callers above the allowed amount will be queued until a spot is released.
 *
 * @function
 * @param {number} [maxConcurrency=5] The maximum number of parallel callers to allow.
 * @returns {module:signals~Semaphore} Limits access to a pool of resources by restricting how many callers can run at a time.
 * @example
 * import { semaphore } from '@paychex/core/signals';
 * import { fetch, createRequest } from '~/path/to/datalayer';
 * import { tracker } from '~/path/to/tracker';
 *
 * const uploadSpots = semaphore(5);
 * const operation = {
 *   base: 'files',
 *   method: 'POST',
 *   path: '/save/:id'
 * };
 *
 * export async function uploadFile(blob) {
 *   const data = new FormData();
 *   const params = { id: tracker.uuid() };
 *   data.append('file', blob, params.id);
 *   try {
 *     await uploadSpots.ready();
 *     await fetch(createRequest(operation, params, data));
 *     return params.id;
 *   } finally {
 *     uploadSpots.release(); // always release
 *   }
 * }
 */
export function semaphore(maxConcurrency = 5) {

    let counter = 0;
    const queue = [];

    function enqueueIfNeeded(resolve) {
        if (++counter <= maxConcurrency)
            resolve();
        else
            queue.push(resolve);
    }

    function ready() {
        return new Promise(enqueueIfNeeded);
    }

    function release(count = 1) {
        const min = Math.max(1, Math.floor(count));
        const amount = Math.min(counter - queue.length, min);
        queue.splice(0, amount).forEach(attempt);
        counter -= amount;
    }

    return Object.defineProperties({
        ready,
        release,
    }, {
        queued: readonly(() => queue.length),
        running: readonly(() => counter - queue.length),
        available: readonly(() => Math.max(0, maxConcurrency - counter)),
    });

}