// src/datasources/ExoPlanetApi.datasource.ts

import axios, { AxiosInstance } from 'axios';
import { IExoPlanetDataSource } from './IExoPlanet.datasource';
import {
    ViewPredictionDTO,
    RegisterPredicitionDTO,
    formatPredictionByViewSchema,
    SignalParams,
    CandidateParams,
    StarParams
} from '../validators/predictionValidator';
import { PredictionRepository } from './../repositories/PredicitionRepository';
import NodeCache from 'node-cache';

// --- Constantes Refatoradas para Clareza e Performance ---
const NASA_API_BASE_URL = process.env.NASA_API_BASE_URL || 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const NASA_API_FORMAT = 'json';
const NASA_TABLE_NAME = 'cumulative';
const NASA_API_COLUMNS = 'kepler_name,koi_score,koi_disposition,koi_prad,koi_duration,koi_period,koi_smass,koi_steff,koi_srad';

// --- Interfaces e Tipos (sem alteração) ---
interface NasaExoPlanet {
    kepler_name: string;
    koi_score: number | null;
    koi_disposition: string;
    koi_prad: number | null;
    koi_duration: number | null;
    koi_period: number | null;
    koi_smass: number | null;
    koi_steff: number | null;
    koi_srad: number | null;
}

type InternalPrediction = {
    id: string;
    description: string;
    probability: number;
    classification: string;
    createdAt: Date;
    candidateParams: Omit<CandidateParams, 'mass_error' | 'radius_error'>;
    signalParams: Omit<SignalParams, 'impact_parameter_value' | 'impact_parameter_error' | 'transit_duration_error' | 'orbital_period_error' | 'transit_depth_value' | 'transit_depth_error'>;
    starParams: Omit<StarParams, 'mass_error' | 'radius_error' | 'effective_temperature_error'>;
    existingData: boolean;
};

// --- Cache Keys ---
const CACHE_KEYS = {
    FIND_ALL: 'findAllExoPlanets',
    FIND_BY_ID: (id: string) => `findByIdExoPlanet_${id}`,
};

export class NasaApiError extends Error {
    constructor(message: string, public readonly status?: number) {
        super(message);
        this.name = 'NasaApiError';
    }
}

export class ExoPlanetApiDataSource implements IExoPlanetDataSource {
    private readonly axiosInstance: AxiosInstance;
    private readonly cache: NodeCache;

    constructor(private readonly predictionRepository: PredictionRepository) {
        this.axiosInstance = axios.create({
            baseURL: NASA_API_BASE_URL,
            timeout: 10000,
        });

        this.cache = new NodeCache({ stdTTL: 3600 }); 
    }

    private _mapPlanetToPrediction(planet: NasaExoPlanet): InternalPrediction {
        return {
            id: planet.kepler_name,
            description: `Exoplanet ${planet.kepler_name} from NASA Exoplanet Archive`,
            probability: planet.koi_score ?? 0,
            classification: planet.koi_disposition,
            createdAt: new Date(),
            existingData: true,
            candidateParams: {
                mass_value: 0, 
                mass_unit: 'Jupiter Mass',
                radius_value: planet.koi_prad ?? 0,
                radius_unit: 'Earth Radius',
            },
            signalParams: {
                transit_duration_value: planet.koi_duration ?? 0,
                transit_duration_unit: 'hours',
                orbital_period_value: planet.koi_period ?? 0,
                orbital_period_unit: 'days',
            },
            starParams: {
                mass_value: planet.koi_smass ?? 0,
                mass_unit: 'Solar Mass',
                radius_value: planet.koi_srad ?? 0,
                radius_unit: 'Solar Radius',
                effective_temperature_value: planet.koi_steff ?? 0,
                effective_temperature_unit: 'K',
            },
        };
    }

    private _buildApiQuery(selectClause: string, whereClause?: string, orderByClause?: string): string {
        let query = `select ${selectClause} from ${NASA_TABLE_NAME}`;
        if (whereClause) {
            query += ` where ${whereClause}`;
        }
        if (orderByClause) {
            query += ` order by ${orderByClause}`;
        }
        return encodeURIComponent(query).replace(/%20/g, '+');
    }
   
    private async _performApiRequest(query: string): Promise<NasaExoPlanet[]> {
        console.log('Enviando a seguinte query para a NASA:', decodeURIComponent(query.replace(/\+/g, ' ')));
        try {
            const response = await this.axiosInstance.get<NasaExoPlanet[]>(`?query=${query}&format=${NASA_API_FORMAT}`);
            return response.data;
        } catch (error: any) {
            console.error('Ocorreu um erro na requisição à API da NASA:', error.message);
            throw new NasaApiError('Falha ao se comunicar com a API da NASA.', error.response?.status);
        }
    }

    async findAll(): Promise<ViewPredictionDTO[]> {
        const cachedData = this.cache.get<ViewPredictionDTO[]>(CACHE_KEYS.FIND_ALL);
        if (cachedData) {
            console.log('Retornando dados do cache para findAll.');
            return cachedData;
        }

        const selectClause = `TOP 30 ${NASA_API_COLUMNS}`;
        const query = this._buildApiQuery(selectClause, undefined, 'koi_score desc');
        
        const planets = await this._performApiRequest(query);

        const predictions = planets.map(planet => {
            const internalPrediction = this._mapPlanetToPrediction(planet);
            return formatPredictionByViewSchema(internalPrediction);
        });
        
        this.cache.set(CACHE_KEYS.FIND_ALL, predictions);

        return predictions;
    }
    
    async findById(id: string): Promise<ViewPredictionDTO | null> {
        const cacheKey = CACHE_KEYS.FIND_BY_ID(id);

        const cachedById = this.cache.get<ViewPredictionDTO>(cacheKey);
        if (cachedById) {
            console.log(`Retornando dados do cache específico para findById: ${id}`);
            return cachedById;
        }

        const allCachedPlanets = this.cache.get<ViewPredictionDTO[]>(CACHE_KEYS.FIND_ALL);
        if (allCachedPlanets) {
            const foundInList = allCachedPlanets.find(p => p.id === id);
            if (foundInList) {
                console.log(`Encontrado no cache de findAll, evitando requisição para o id: ${id}`);
                this.cache.set(cacheKey, foundInList);
                return foundInList;
            }
        }
        
        const whereClause = `kepler_name='${id}'`;
        const query = this._buildApiQuery(NASA_API_COLUMNS, whereClause);
        
        const planets = await this._performApiRequest(query);
        const planet = planets[0];

        if (!planet) {
            return null;
        }
        
        const internalPrediction = this._mapPlanetToPrediction(planet);
        const formattedPrediction = formatPredictionByViewSchema(internalPrediction);

        this.cache.set(cacheKey, formattedPrediction);

        return formattedPrediction;
    }

    async save(predictionData: RegisterPredicitionDTO): Promise<ViewPredictionDTO> {
        const createdPrediction = await this.predictionRepository.createPrediction({
            ...predictionData,
            createdAt: new Date(),
            existingData: true,
        });

        this.cache.del(CACHE_KEYS.FIND_ALL);

        return formatPredictionByViewSchema(createdPrediction);
    }
}