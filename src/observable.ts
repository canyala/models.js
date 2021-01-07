import { Disposable, Action_0, Action_1, Predicate_1, Function_2, Function_0 } from "./standard";

/**
 * The representation of an active observation.
 * 
 * @remarks
 * It is convenient to store observations in an array in order to enable
 * simple clean up.
 * 
 * @example
 * Here is some sample code to begin and end observations.
 * 
 * ```ts
 * function beginObservations() {
 * 
 *    var observations = 
 *    [
 *       AModel.Prop_1.observe(value => this.setState({ state1: value})),
 *       AModel.Prop_2.observe(value => this.setState({ state2: value}))
 *    ];
 * }
 * 
 * function endObservations() {
 * 
 *    observations.forEach(observation => observation.end());  
 * }
 * ```
 * 
 * Returned by {@link (ObservableOf:class).(observe:instance)}
 */
export interface Observation {
    /**
     * Ends an active observation.
     */
    /*end: () => void*/
    end: Action_0
}

/**
 * The representation of a change handler.
 * 
 * @remarks
 * When an observed property change state, the change handler will be called with the new value.
 * 
 * Argument to {@link (ObservableOf:class).(observe:instance)}
 */
export interface ChangeHandler<T> { 
    /**
     * @param state - The new, changed state
     */
    (state: T): void
}

/**
 * The abstraction of a get operation.
 * 
 * @remarks
 * Used when constructing {@link (Property:class)} in order to 
 * provide loose coupling of lazy state.
 */
export interface GetFunc<T> { 
    /**
     * @returns a promise of state delivery.
     */
    (): Promise<T|null>
}

/**
 * The abstraction of an asynchronous set operation.
 *
 * @remarks
 * Used when constructing {@link (Property:class)} in order to
 * provide loose coupling of lazy state.
 */

export interface SetFunc<T> {
    (value: T): void
}

/**
 * The abstraction of an asynchronous add operation.
 *
 * @remarks
 * Used when constructing {@link (Property:class)} in order to
 * provide loose coupling of lazy state.
 */

export interface AddFunc<T> {
    (value: T): Promise<void>
}

/**
 * The abstraction of an asynchronous delete operation.
 *
 * @remarks
 * Used when constructing {@link (Property:class)} in order to
 * provide loose coupling of lazy state.
 */

export interface DeleteFunc<T> {
    (value: T): Promise<void>
}

/**
 *  The event of T class 
 */
export interface Event<T> {
    // id?: string; // TODO: replace server side to use id for all id's?
    // TODO Do we have to restrict what the event can contain?
    datafileId?: string;
    projectId?: string;
    modelId?: string;
    jobId?: string;
    code?: any;
    message?: string;
}

/**
 *  The event filter of T class
 */
export interface Filter<T> {
    (event: Event<T>): boolean;  // TODO: Add typed event data
}

/**
 *  The action of T class
 */
export interface Action<T> {
    (event: Event<T>): void;
}

/**
 *  The events source of T class 
 */
export interface Events<T> {
    (filter: Filter<T>, action: Action<T>): Disposable; 
}

/*
 *  A PropertyDTO, [D]ata [T]ransfer [O]bject, snapshot.
 */
export interface PropertyDTO {
    path: string;
    name: string;
    value: string;
    dependencies: string[];
    dependents: string[];
}

/**
 * The base class for all observables.
 * 
 * @remarks
 * This class is abstract and only intended to extend from.
 * 
 */
export abstract class Observable implements Disposable {

    protected _revision: number;
    protected dependents: Set<Observable>; // outputs
    protected dependencies: Set<{ revision: number, observable: Observable }>;  // inputs, with revision state tracking

    /**
     * Create a new Observable.
     * 
     * @param dependencies - an array of observables this observable is depending on (inputs)
     */
    constructor(dependencies: Observable[]) {

        this._revision = 0;
        this.dependents = new Set<Observable>();
        this.dependencies = new Set<{ revision: number, observable: Observable }>(dependencies.map(dependency => ({ revision: dependency.revision, observable: dependency })));
        this.dependencies.forEach(dependency => dependency.observable.addDependent(this));
    }

    /***
     * Dispose of the observable, clean up dependecies.
     * 
     * @experimental not used in any scenarios yet...
     */
    dispose() {

        this.dependencies.forEach(dependency => dependency.observable.removeDependent(this));
    }

    /**
     * Add a dependant observer.
     * @param dependent - an observable that depends on this observable
     */
    protected addDependent(dependent: Observable): void {
         
        this.dependents.add(dependent);
    }

    /**
    * Delete a dependant observer.
    * @param dependent - an observable that depends on this observable
    */
    protected removeDependent(dependent: Observable) {

        this.dependents.delete(dependent);
    }

    /**
     * Trigger all change handlers.
     * @internal
     */
    public abstract _triggerChangeHandlers(): void;
   
    /**
     * Indicates if the observable is asynchronously getting updated data or not.
     * 
     * @remarks
     * There is no public set operation.
     * 
     * @returns `true` if updating or `false` if not updating
     */
    public abstract get isUpdating(): boolean;

    /**
     * Indicates if the observable has a valid state that can be used in computations etc.
     *
     * @return `true` if the state is undefined, otherwise false
     */
    public get isUndefined(): boolean {
        return this._revision < 1;
    }

    /**
    * Indicates if the observable has a newer state compared to the state of the revision.
    *
    * @return `true` if the state is dirty, otherwise false
    */
    public isDirty(revision: number) {
        return this._revision > revision;
    }

    /**
     * Readonly access to current revision
     */
    public get revision(): number {
        return this._revision;
    };

    /**
     * The Observable as a json string.
     */
     public abstract toJSON(): string; 

    /**
     * The Observable as a PropertyDTO[]
     */
    public abstract toDTO(): PropertyDTO[];

    /**
     * The aggregate name of a property
     * 
     * @return the name of the Property as a meber of an aggregate
     */
    public abstract get name(): string;

    /**
    * The aggregate path of a property
    * 
    * @return the name of the Property as a meber of an aggregate
    */
    public abstract get path(): string;

    /**
     * Resets or invalidates the value of the observable.
     * @param force if true reset is forced even if state isn't dirty. Avoid usage unless...
     * @remarks
     * Activates the get operation of the observable.
     */
    public abstract reset(force?: boolean): void;

    /**
     * Reboots the state of of the observable.
     * @remarks
     * Resets the inner state of the observable to
     * an initial state like after construction,
     * also resets the revision and tracked
     * revisions to 0.
     */
    public abstract _reinit(): void;
}

/**
 * The generic base class for all observables.
 * 
 * @remarks
 * This class is abstract and only intended to extend from. 
 */
export abstract class ObservableOf<TModel,TAggregate=TModel> extends Observable {

    protected changeHandlers: Set<ChangeHandler<TAggregate>>;

    /**
     * Create a new ObservableOf<T>
     * 
     * @param dependencies 
     */
    
    constructor(dependencies: Observable[]) {

        super(dependencies);

        this.changeHandlers = new Set<ChangeHandler<TAggregate>>();
    }

    /**
     * Observe changes by providing a change handler.
     * 
     * @remarks
     * The change handler must expect the value as an argument.
     * See { @link (Observation:interface)} for a more elaborate exemple.
     * 
     * @example
     * ```ts
     * let observation = aProperty.observe(value => something.setState(value)); 
     * observation.end();
     * ``` 
     * 
     * @param changeHandler - a function that will handle changes.
     * @return an observation object that must be ended.
     */

    public observe(changeHandler: ChangeHandler<TAggregate>): Observation {

        this.changeHandlers.add(changeHandler);

        if (this.isUndefined) {
            this.reset();
        }
        else {
            changeHandler(this.value);
        }

        return {
            end: () => {

                this.changeHandlers.delete(changeHandler);

                if (this.changeHandlers.size < 1) {
                    this._reinit(); // If removed all changeHandlers have been, the observable reinitialize
                }
            }
        }
    }

    /**
     * Invokes all change handlers.
     * 
     * @remarks
     * Intended for internal use only.
     * 
     * @internal
     */
    public _triggerChangeHandlers(): void {

        this.changeHandlers.forEach(changeHandler => changeHandler(this.value));
    }

    /**
     * Get or set the value of the observable, set will trigger change observation.
     */
    public abstract get value(): TAggregate;

    public abstract set value(state: TAggregate);

    /**
     * Convert the Observable to a JSON string.
     */
    public toJSON(): string {
        const name = this.name;
        const value: any = this.value;
        const jsonValue = value ? JSON.stringify(value) : 'undefined';
        const dependents = JSON.stringify(Array.from(this.dependents).map(item => item.path));
        const dependencies = JSON.stringify(Array.from(this.dependencies).map(item => item.observable.path));
        const json = `"${name}":{"value":${jsonValue},"dependencies":${dependencies},"dependents":${dependents}}`;
        return json;
    }

    /**
     * Convert the Observable to an array of a SINGLE (1) [D]ata [T]ransfer [O]bject, DTO.
     *
     * @remarks
     * The reason for returning an array with a single element in it is that
     * it simplifies the toDTO(): PropertyDTO[] implementation in Aggregates,
     * no need for type checking.
     */
    public toDTO(): PropertyDTO[] {
        return [{
            path: this.path,
            name: this.name,
            value: this.value ? JSON.stringify(this.value) : 'undefined',
            dependents: Array.from(this.dependents).map(item => item.path),
            dependencies: Array.from(this.dependencies).map(item => item.observable.path)
        }];
    }
}

/**
 *  Named constructor arguments for Property<T>
 */
export interface PropertyCtorArgs<TModel,TAggregate=TModel> {

    /**
     * Default state generator for the property
     */
    default: Function_0<TAggregate>;            
    get?: GetFunc<TAggregate>;
    set?: SetFunc<TModel>;
    dependencies?: Observable[];
    events?: Events<any>;
    filter?: Filter<any>;
    action?: Action<any>;
    errors?: Action_1<string>;
    /**
     * Set to true if internal state should be cached 
     * @remarks
     * Internal state is reinitialized when
     * any observers no longer are are attached
     */
    cached?: boolean;
}

/**
 * The observable property class.
 * 
 * @remarks
 * A property is a state managing container for view models that provide
 * change notifications for viewers as well as a loosly coupled lazy
 * get mechanism for providers.
 */
export class Property<TModel,TAggregate=TModel> extends ObservableOf<TModel,TAggregate> {

    private _default: Function_0<TAggregate>;
    private _value: TAggregate;
    private _cached: boolean;

    private _isAsyncUpdating: boolean = false;
    private _name: string | undefined = "";

    public parent: IAggregate;

    private getFunc: GetFunc<TAggregate>;
    private setFunc: SetFunc<TModel>;
    private events: Events<any>;
    private filter: Filter<any>;
    private action: Action<any>;
    private errors: Action_1<string>;

    /**
     * Create a new Property<TModel,TAggregate>
     * 
     * @param args - the arguments to initialize the property with
     * @param parent - the aggregating parent 
     */
    constructor(args: PropertyCtorArgs<TModel, TAggregate>, parent: IAggregate) {

        super(args.dependencies || []);

        this.parent = parent;

        if (typeof args.default === 'function') {
            this._default = args.default;  // Keep the default state generator for later use
        } else {
            // We got a value, not a function - may happen if ts has not been used properly, we play nice and make it a func and warn if so...
            this._default = (): TAggregate => (args.default as unknown as any);

            if (console && console.warn) {
                // We want this for F12/dev/console so we can fix it properly but we do not want it to fail tests...
                console.warn(`WARNING: args.default is not a function for ${this.path}`);
            }
        }

        this._value = this._default(); // Initialize state using the default state generator

        this._cached = args.cached === true; // Get cached arg, default to false, not cached

        this.errors = args.errors || ((msg: string) => console.warn(`Warning "${msg}" @ ${this.path}`));

        // Default event source is a 'null object' that eats all registrations
        this.events = args.events || ((_filter: Filter<any>, _action: (_event: Event<any>) => void): Disposable => { return { dispose: () => {} } as Disposable });
        // Default action performs a reset, thereby requesting an update of the property
        this.action = args.action || ((_event: Event<any>) => this.reset(true));
        // Default filter accepts everything
        this.filter = args.filter || ((_event: Event<any>) => true);

        this.getFunc = args.get || (async () => this._value);
        this.setFunc = args.set || (value => { });
        
        this.events(this.filter, this.action);
    }

    /**
     * Re-initialize the observable.
     * @remarks
     * State, revsion and tracked revisions must be reinitialized
     * and we can reinitialize all dependents as well
     * @comment internal us only
     */
    public _reinit(): void {

        if (this._revision > 0) {
            //console.log(`_reinit ${this.path}`);
            this.dependents.forEach(dependent => dependent._reinit()); // We reinit all that depends on us
            this.dependencies.forEach(dependency => dependency.revision = 0); // We must reset our captured revisions
            if (!this._cached) this._value = this._default(); // Initialize the state if not cached
            this._revision = 0; // Initialize the revision
        }
    }

    /***
     *  Get the observable aspect of the property
     *  @description present to give conformity with Collection<Tm,Ta> that must use it.
     */
    public get observable(): Observable {
        return this;
    }

    /***
     *  Get the model aspect of the property
     *  @description for simple properties, model and aggregate are the same.
     */
    public get model(): TModel {

        let object: any = this._value;

        if (object.toModel) {
            return object.toModel() as TModel;
        }
        else {
            return object as TModel;
        }
    }

    /***
     *  Get children of a property
     *  @comment This is relevant only when property.value is a js collection like Array<Property<T>|Aggregate>, Map<Property<T>|Aggregate> or Set<Property<T>|Aggregate>.
     */
    public get children(): Array<Observable> & any[] {

        if (Array.isArray(this._value)) {
            let array: any[] = (this._value as unknown) as any[];
            if (array.length > 0 && array[0].parent === this) { 
                return array; //return this._value
            }
        }

        return [];
    }

    /**
     *  Get the name of the property in the parent aggregate.
     */
    public get name(): string {

        let anyParent: any = this.parent;
        let anyArray: any = anyParent._value;

        if (Array.isArray(anyArray)) {
            for (let [key, value] of Object.entries(anyArray)) {

                if (value === this) {
                    this._name = key.toString();
                    return this._name;
                }
            }
        }
        else {

            if (this._name) {
                return this._name;  
            }

            for (let [key, value] of Object.entries(this.parent)) {

                if (value === this) {

                    this._name = (key[0] === '_' && key[1] !== '_') ? key.substr(1, 1).toUpperCase() + key.substr(2) : key;
                    return this._name;
                }
            }
        }

        this._name = 'undefined';
        return this._name;
    }

    /**
     *  Get the path of the property in the ViewModel
     */
    public get path(): string {

        let thisPath: string = this.name;
        let thisParent: IAggregate|null = this.parent;

        while (thisParent) {

            if (thisParent.name) {
                if (thisParent.name !== '__items') {
                    if (thisPath[0] >= '0' && thisPath[0] <= '9') {
                        thisPath = `${thisParent.name}[${thisPath}]`;
                    }
                    else {
                        thisPath = `${thisParent.name}.${thisPath}`;
                    }
                }
            }
            else {
                thisPath = `undefined.${thisPath}`;
            }

            thisParent = thisParent.parent;
        }

        return thisPath;
    }
    
    /**
     *  Get by reference or set by value the state of the property.
     *  @tutorial
     *  By design, assignment always updates revision, avoid
     *  assignment if this isn't want you want.
     */
    public get value(): TAggregate {
        return this._value;
    }

    public set value(value: TAggregate) {
        this.set(value); // defined below, works for all as well.
    }

    /**
    *  Set the value of the property.
    *  @param value The value to set 
    *  @param bRef Optional byRef flag, defaults to false. Be careful when true!
    *  @tutorial
    *  Use byRef:true for large data, like large tabels and/or arrays and such. 
    *  Possibly combine with args.cached: true in the constructor
    *  By design, set() always update revision
    */
    public set(value: TAggregate, byRef?:boolean) {

        if (byRef !== true && typeof value === 'object') {
            if (Array.isArray(this._value) && Array.isArray(value)) {
                (this._value as unknown as any[]) = (value as unknown as any[]).slice(); // Clone arrays to avoid reference errors
            } else {
                this._value = Object.assign(this._value, value); // Must fill-in object to keep possible functions on it
            }
        } else {
            this._value = value;
        }

        /*
        if (this.revision === Number.MAX_SAFE_INTEGER) {
            alert('MAX_SAFE_INTEGER reached for Property<TM,TA>.revision');  // Not so likely
        }
        */

        this._revision++;

        if (!this._isAsyncUpdating) {

            // We are not async updating, so we must have a state change that
            // should be communicated to the service layer.

            let modelOrAggregate: any = this._value;

            if (modelOrAggregate.asModel) {

                this.setFunc(modelOrAggregate.asModel());
            }
            else {

                this.setFunc(modelOrAggregate as TModel);
            }
        }

        this._triggerChangeHandlers();
        this.dependents.forEach(dependent => dependent.reset());
    }

    /**
     *  Get the transition status of the property value.
     * 
     *  @returns `true` if the value of the property is updating, otherwise `false`
     */
    public get isUpdating(): boolean {

        return this._isAsyncUpdating;
    }

    /**
     * Reset the value of the property.
     * 
     * @remarks
     * Activates the get operation of the property.
     * 
     * @param force - set to true to force an update even if no dependencies is dirty, needed for events to work
     */
    public reset(force?: boolean): void {

        let undefinedDependencies = Array.from(this.dependencies).filter(dependency => dependency.observable.isUndefined);

        if (undefinedDependencies.length > 0) {
            // const n = undefinedDependencies.length;
            /*console.log(`${this.path}:Property<T>.reset: ${n} dependenc${n === 1 ? 'y is' : 'ies are'} undefined, requiring reset()`);*/
            undefinedDependencies.forEach(dependency => dependency.observable.reset()); // Attempt making undefined dependencies defined.
            return; // Must return, dependencies will fire changes due to .reset() in above line.
        }

        if (this.dependencies.size > 0) {

            let someWasDirty = false;
            for (let dependency of this.dependencies) {

                if (dependency.observable.isDirty(dependency.revision)) {
                    // We have a revision that has changed compared to our tracked revision., update and flag it as some dirty!
                    dependency.revision = dependency.observable.revision;
                    someWasDirty = true;
                }
            }

            if (force !== true && !someWasDirty) {
                // No state change in ANY of the dependencies found, avoid async get 
                // (if ALL needed, use a composite state object with 'all' parts instead, do not change this)
                /*console.log(`Avoiding reset/get for ${this.path}, no dependencies was dirty.`);*/
                return;
            }
        }

        if (this._isAsyncUpdating) {
            //console.log(`REENTRANT reset detected for ${this.path}`);
            return; // Disregard reentrant resets  
        }

        this._isAsyncUpdating = true;

        this.getFunc()
            .then(value => {
                if (value) {  // value can be 'null' if an asynch "peek" was done but no value was found (= no action if so). 
                    this.value = value;
                } else if (typeof(value) === 'number' || typeof(value) === 'bigint') {  // value could be a 0 or a 0n that we want to catch with this!
                    this.value = value;
                }
            })
            .catch(reason => {
                console.error(`CATCH ${this.name}: Property<T>.reset()  ${JSON.stringify(reason)}`);
            })
            .finally(() => this._isAsyncUpdating = false);
    }

}

/**
 * The interface for PropertyAggregates
 */
export interface IAggregate {

    name: string;
    path: string;
    parent: IAggregate|null;
    children: Array<IAggregate | Observable>;
}

/**
 * The base class for property aggregates (named and/or indexed groups of properties)
 */
export class Aggregate implements IAggregate {

    protected _name: string | undefined;
    public parent: IAggregate | null;

    constructor(parent: IAggregate|null) {

        this.parent = parent;
    }

    /**
     *  Get the name of the property in the parent aggregate.
     *  
     */
    public get name(): string {

        if (this.parent === null) {

            return this._name || 'ViewModel';
        }
        else {

            let anyParent: any = this.parent;
            let anyArray: any = anyParent._value;

            if (Array.isArray(anyArray)) {
                for (let [key, value] of Object.entries(anyArray)) {

                    if (value === this) {
                        this._name = key.toString();
                        return this._name;
                    }
                }
            }
            else {

                if (this._name) {

                    return this._name;
                }

                for (let [key, value] of Object.entries(this.parent)) {

                    if (value === this) {

                        this._name = (key[0] === '_' && key[1] !== '_') ? key.substr(1, 1).toUpperCase() + key.substr(2) : key;

                        return this._name;
                    }
                }
            }
            this._name = 'undefined';
            return this._name;
        }
    }

    /**
     *  Get the path of the property in the ViewModel
     *
     */
    public get path(): string {

        let thisPath = this.name;
        let thisParent = this.parent;

        while (thisParent && thisParent.name) {

            if (thisParent.name !== '__items') {
                if (thisPath[0] >= '0' && thisPath[0] <= '9') {
                    thisPath = `${thisParent.name}[${thisPath}]`;
                }
                else {
                    thisPath = `${thisParent.name}.${thisPath}`;
                }
            }

            thisParent = thisParent.parent;
        }

        return thisPath;
    }

/**
 *  Get the children of this property aggregate.
 *
 *  @description access aggregated child properties
 *  
 */
    public get children(): Array<Aggregate|Observable> {

        let result: Array<Aggregate|Observable> = [];

        for (let [key, value] of Object.entries(this)) {

            if (value && this === value.parent) {

                // Some "magic" to hide the internals of IndexCollections,
                // elevates the internal items. _items will not show up
                // as a child but its content will.

                if (key === '__items') {
                    result.push(...value.value);
                }
                else {
                    result.push(value);
                }
            }
        }

        return result;
    }

    /**
     * Convert the Aggregate to a JSON string.
     */
    public toJSON(): string {

        const name = this.name;
        let children: string = "";

        for (const child of this.children) {

            if (children.length > 0) {
                children = `${children}, ${child.toJSON()}`;
            } else {
                children = `${child.toJSON()}`;
            }
        }

        const json = `"${name}":{${children}}`;

        return json;
    }

    /**
    * Convert the Aggregate to an array of [D]ata [T]ransfer [O]bjects, DTO's
    *
    * @description
    * Will cover all Observables below this level, PropertyDTO.path will always be from the top node.
    */
    public toDTO(): PropertyDTO[] {

        let list: PropertyDTO[] = [];

        for (const child of this.children) {
            list = list.concat(child.toDTO());  // Both Aggregate and Observable implements 'toDTO'.
        }

        return list;
    }
}

export abstract class MappedAggregate<TModel> extends Aggregate {

    abstract toModel(): TModel;  // Do not rename! Used dynamically to detect mapped aggregates in Property.model as well as actually map to model. 
}

/**
 *  Named constructor arguments for PropertyArray<T>
 */
export interface CollectionCtorArgs<TModel,TAggregate=TModel> {

    default: Function_0<TAggregate>;
    initial?: Array<TModel>;
    map?: Function_2<TAggregate, TModel, IAggregate>;

    get?: GetFunc<Array<TModel>>;
    set?: SetFunc<Array<TModel>>;

    add?: AddFunc<TModel>;
    delete?: DeleteFunc<TModel>;

    dependencies?: Observable[];
    events?: Events<any>;
    filter?: Filter<any>;
    action?: Action<any>;
}

/**
 * @experimental
 */
export interface SetCurrentArgs<TModel,TAggregate> {

    property?: Property<TModel, TAggregate>;
    predicate?: Predicate_1<TAggregate>;
    index?: number;
}

/**
 * The Collection<TModel,TAggregate=TModel> class
 * @description As a default, the aggregate class _is_ the model class allowing for simpler cases. 
 */
export class Collection<TModel,TAggregate=TModel> extends Aggregate {  

    public __focus: Property<number>; // or __focus ?
    private __items: Property<Array<Property<TModel,TAggregate>>>;  

    private readonly getFunc: GetFunc<TModel[]>;
    private readonly setFunc: SetFunc<TModel[]>;
    private readonly addFunc: AddFunc<TModel>;
    private readonly deleteFunc: DeleteFunc<TModel>;
    private readonly mapFunc?: Function_2<TAggregate, TModel, IAggregate>;

    public Errors: Property<Array<string>>;
    public Default: Property<TModel, TAggregate>;
    public Updating: Property<boolean>;

    public SelectedIndices: Property<Set<number>>; // Experimental
    

    private _map(element: TModel) : TAggregate {

        //console.log('_map element');

        if (this.mapFunc) {
            return this.mapFunc(element, this.__items);
        }

        return (element as any) as TAggregate;  // For simple cases, the model _is_ the aggregate, mapping is avoided.
    }

    private _box(elements: Array<TModel> | null | undefined): Array<Property<TModel,TAggregate>>|null {

        //console.log('_box elements');

        if (elements && elements !== null) {

            //let mapped = elements.map(element => new Property<TModel, TAggregate>({ default: this._map(element) }, this.__items));   // OLD way, default was not a generator

            let mapped = elements.map(element => new Property<TModel, TAggregate>({ default: () => this._map(element) }, this.__items)); // NEW way default is a generator, does it work?

            /* ALTERNATE way, capture the mapping, needed?
            let mapped: Property<TModel, TAggregate>[] = [];

            for (let element of elements) {
                let capturedDefault = this._map(element); 
                let property = new Property<TModel, TAggregate>({ default: () => capturedDefault }, this.__items);
                mapped.push(property);
            }
            */

            return mapped;
        }

        return null;
    }
    
    private async _boxedGet() {

        //console.log('_boxedGet');
        this.Updating.value = true;
        let rawResponse = await this.getFunc();
        let boxedResponse = this._box(rawResponse);
        this.Updating.value = false;
        return boxedResponse;
    }

    constructor(args: CollectionCtorArgs<TModel, TAggregate>, public parent: IAggregate) {

        super(parent);

        this.getFunc = args.get || (async () => null);
        this.setFunc = args.set || ((value: TModel[]) => { });
        this.mapFunc = args.map;

        this.addFunc = args.add || (async (value: TModel) => { });
        this.deleteFunc = args.delete || (async (value: TModel) => { });

        this.__focus = new Property<number>({ default: () => -1 }, this);

        let capturedBox = this._box(args.initial) || [];

        this.__items = new Property<Array<Property<TModel, TAggregate>>>({

            //default: this._box(args.initial) || [],
            default: () => capturedBox,

            get: async () => this._boxedGet(),

            events: args.events,
            filter: args.filter,
            action: args.action,

            errors: msg => this.Errors.value = this.Errors.value.concat(msg)

        }, this);

        
        this.Default = new Property<TModel, TAggregate>({ default: args.default }, this);
        this.SelectedIndices = new Property<Set<number>>({ default: () => new Set<number>() }, this);
        this.Errors = new Property<Array<string>>({ default: () => [] }, this);
        this.Updating = new Property<boolean>({ default: () => true }, this);
    }

    // @experimental
    public SetCurrentByProperty(property: Property<TModel,TAggregate>): void {

        for (let index = 0; index < this.__items.value.length; index++) {

            if (property === this.__items.value[index]) {
                this.__focus.value = index;
                return;
            }
        }

        this.__focus.value = -1;
    }

    // @experimental
    public SetCurrentByPredicate(predicate: Predicate_1<TAggregate>): void {

        for (let index = 0; index < this.__items.value.length; index++) {

            if (predicate(this.__items.value[index].value)) {
                this.__focus.value = index;
                return;
            }
        }

        this.__focus.value = -1;
    }

    // @experimental
    public SetCurrentByIndex(index: number): void {

        if (index >= 0 && index < this.__items.value.length) {
            this.__focus.value = index;
        }
        else {
            this.__focus.value = -1;
        }
    }

    public get asObservable(): Observable {
        return this.__items;
    }

    public get size(): number {

        return this.__items.value.length;
    }

    private validatedFocus(index: number): number {

        if (index < -1 || index >= this.__items.value.length) {

            const thisPath = this.path;
            const errorMsg = `Illegal __focus (${index}) in ${thisPath}: Collection<T>`;
            //console.warn(errorMsg);

            if (this.__items.value.length < 1) {

                throw new Error(errorMsg);
            }
            else {

                return this.__items.value.length-1; // Add appends, therefore the last one is most likely...
            }
        }
        else {

            return index;
        }
    }

    /**
     * Get current as index
     * @description index
     */
    public get CurrentAsIndex(): number {

        return this.validatedFocus(this.__focus.value);
    }

    /**
     * Get current as model
     * @description model
     */
    public get CurrentAsModel(): TModel | null {

        const index = this.validatedFocus(this.__focus.value);
        return index >= 0 ? this.__items.value[index].model : null;
    }

    /**
     * Get current as aggregate
     * @description aggregate
     */
    public get CurrentAsAggregate(): TAggregate | null {

        const index = this.validatedFocus(this.__focus.value);
        return index >= 0 ? this.__items.value[index].value : null;
    }

    /**
     * Get current as property
     * @description property
     */
    public get CurrentAsProperty(): Property<TModel, TAggregate> | null {

        const index = this.validatedFocus(this.__focus.value);
        return index >= 0 ? this.__items.value[index] : null;
    }

    /**
     * Get current as entry
     * @description entry
     */
    public get CurrentAsEntry(): [number, Property<TModel, TAggregate> | null] {

        const index = this.validatedFocus(this.__focus.value);
        return [index, index >= 0 ? this.__items.value[index] : null];
    }

    public add(value: TModel): void {

        this.addFunc(value);
        //let property = new Property<TModel,TAggregate>({ default: this._map(value) }, this.__items);
        let capturedMap = this._map(value);
        let property = new Property<TModel, TAggregate>({ default: () => capturedMap }, this.__items);
        const index = this.__items.value.push(property);
        this.__focus.value = index;

        this.__items._triggerChangeHandlers();
    }

    public deleteIndex(index: number): void {

        let property = this.__items.value.splice(index, 1)[0];

        if (this.__items.value.length < 1) {
            this.__focus.value = -1;
        }
        else {
            this.__focus.value = 0; // TODO: Is this OK?
        }

        this.deleteFunc(property.model);

        property.dispose();

        this.__items._triggerChangeHandlers();
    }

    public delete(predicate: Predicate_1<TModel>): void {

        for (let i = 0; i < this.__items.value.length; i++) {

            let model = this.__items.value[i].model;
            if (predicate(model)) {
                this.deleteIndex(i);
            }
        }
    }

    public sort(compareFn: (a: Property<TModel,TAggregate>, b: Property<TModel,TAggregate>) => number): void {

        this.__items.value.sort(compareFn);
        this.__items._triggerChangeHandlers();
    }

    public reverse(): void {

        this.__items.value.reverse();
        this.__items._triggerChangeHandlers();
    }

    public property(index: number): Property<TModel,TAggregate> {

        return this.__items.value[index];
    }

    public *properties(): Generator<Property<TModel, TAggregate>> { // TODO: values(args?: { skip?: number, take?: number }|undefined)

        for (let property of this.__items.value) {

            yield property;
        }
    }

    public observeProperties(changeHandler: ChangeHandler<Array<Property<TModel,TAggregate>>>): Observation {

        return this.__items.observe(changeHandler); // properties
    }

    public aggregate(index: number) : TAggregate {

        return this.__items.value[index].value;
    }

    public *aggregates(): Generator<TAggregate> {

        for (let property of this.__items.value) {

            yield property.value;
        }
    }

    public observeAggregates(changeHandler: ChangeHandler<Array<TAggregate>>): Observation {

        return this.__items.observe(state => changeHandler(state.map(property => property.value))); // un-boxed aggregates
    }

    public model(index: number): TModel {

        return this.__items.value[index].model;
    }

    public *models() : Generator<TModel> {   // TODO: values(args?: { skip?: number, take?: number }|undefined) 

        for (let property of this.__items.value) {

            yield property.model;
        }
    }

    public observeModels(changeHandler: ChangeHandler<Array<TModel>>): Observation {

        return this.__items.observe(state => changeHandler(state.map(property => property.model))); // un-boxed models
    }

    public find(predicate: Predicate_1<TModel>): TModel | undefined {

        for (let i = 0; i < this.__items.value.length; i++) {

            let model = this.__items.value[i].model;
            if (predicate(model)) {
                return model;
            }
        }

        return undefined;
    }

    public findIndex(predicate: Predicate_1<TModel>): number {

        for (let i = 0; i < this.__items.value.length; i++) {

            if (predicate(this.__items.value[i].model)) {
                return i;
            }
        }

        return -1;
    }
}

/**
 * The base class for ViewModel
 */
export class ViewModel extends Aggregate {

    constructor(modelName: string) {

        super(null);
        this._name = modelName;
    }

    /**
     *  Get the path of the property in the ViewModel
     *
     */
    public get path(): string {

        let thisPath = this.name;
        return thisPath;
    }
}
