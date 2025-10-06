import axios, { AxiosInstance } from 'axios';
import { IExoPlanetDataSource } from './IExoPlanet.datasource';
import {
    ViewPredictionDTO,
    formatPredictionByViewSchema,
    SignalParams,
    CandidateParams,
    StarParams
} from '../validators/predictionValidator';
import { PredictionRepository } from './../repositories/PredicitionRepository';
import NodeCache from 'node-cache';

const NASA_API_BASE_URL = process.env.NASA_API_BASE_URL || 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';
const NASA_API_FORMAT = 'json';
const NASA_TABLE_NAME = 'cumulative';
const NASA_API_COLUMNS = 'kepler_name,koi_score,koi_disposition,koi_prad,koi_prad_err1,koi_duration,koi_duration_err1,koi_period,koi_period_err1,koi_smass,koi_smass_err1,koi_steff,koi_steff_err1,koi_srad,koi_srad_err1,koi_depth,koi_depth_err1,koi_impact,koi_impact_err1,koi_teq,koi_model_snr';

interface NasaExoPlanet {
    kepler_name: string;
    koi_score: number | null;
    koi_disposition: string;
    koi_prad: number | null;
    koi_prad_err1: number | null;
    koi_duration: number | null;
    koi_duration_err1: number | null;
    koi_period: number | null;
    koi_period_err1: number | null;
    koi_smass: number | null;
    koi_smass_err1: number | null;
    koi_steff: number | null;
    koi_steff_err1: number | null;
    koi_srad: number | null;
    koi_srad_err1: number | null;
    koi_depth: number | null;
    koi_depth_err1: number | null;
    koi_impact: number | null;
    koi_impact_err1: number | null;
    koi_teq: number | null; 
    koi_model_snr: number | null; 
}

type InternalPrediction = {
    id: string;
    description: string;
    probability: number;
    classification: string;
    createdAt: Date;
    candidateParams: CandidateParams;
    signalParams: SignalParams;
    starParams: StarParams;
    existingData: boolean;
};

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
            timeout: 15000, // Aumentei o timeout para 15s por segurança
        });

        this.cache = new NodeCache({ stdTTL: 3600 });
    }
   async searchExoPlanets(query: string): Promise<ViewPredictionDTO[]> {
    if (!query || query.trim() === '') {
        throw new NasaApiError("O parâmetro 'query' é obrigatório.", 400);
    }

    const cachedData = this.cache.get<ViewPredictionDTO[]>(`searchExoPlanets_${query}`);
    if (cachedData) {
        console.log(`Retornando dados do cache para searchExoPlanets: ${query}`);
        return cachedData;
    }

    const selectClause = NASA_API_COLUMNS;
    const whereClause = `kepler_name LIKE '%${query}%' OR koi_disposition LIKE '%${query}%'`;
    const orderByClause = 'koi_score DESC';

    const apiQuery = this._buildApiQuery(selectClause, whereClause, orderByClause) + ' LIMIT 50';

    const planets = await this._performApiRequest(apiQuery);

    const predictions = planets.map(planet => {
        const internalPrediction = this._mapPlanetToPrediction(planet);
        return formatPredictionByViewSchema(internalPrediction);
    });

    this.cache.set(`searchExoPlanets_${query}`, predictions);

    return predictions;
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
                mass_error: 0,
                mass_unit: 'Jupiter Mass',
                radius_value: planet.koi_prad ?? 0,
                radius_error: planet.koi_prad_err1 ?? 0,
                radius_unit: 'Earth Radius',
                equilibrium_temp: planet.koi_teq ?? 0,
            },
            signalParams: {
                transit_duration_value: planet.koi_duration ?? 0,
                transit_duration_error: planet.koi_duration_err1 ?? 0,
                transit_duration_unit: 'hours',
                orbital_period_value: planet.koi_period ?? 0,
                orbital_period_error: planet.koi_period_err1 ?? 0,
                orbital_period_unit: 'days',
                transit_depth_value: planet.koi_depth ?? 0,
                transit_depth_error: planet.koi_depth_err1 ?? 0,
                impact_parameter_value: planet.koi_impact ?? 0,
                impact_parameter_error: planet.koi_impact_err1 ?? 0,
                signal_to_noise: planet.koi_model_snr ?? 0,
            },
            starParams: {
                mass_value: planet.koi_smass ?? 0,
                mass_error: planet.koi_smass_err1 ?? 0,
                mass_unit: 'Solar Mass',
                radius_value: planet.koi_srad ?? 0,
                radius_error: planet.koi_srad_err1 ?? 0,
                radius_unit: 'Solar Radius',
                effective_temperature_value: planet.koi_steff ?? 0,
                effective_temperature_error: planet.koi_steff_err1 ?? 0,
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
        return query;
    }
    
    private async _performApiRequest(query: string): Promise<NasaExoPlanet[]> {
        console.log('Enviando a seguinte query para a NASA:', query);
        try {
            const response = await this.axiosInstance.get<NasaExoPlanet[]>('', {
                params: {
                    query: query,
                    format: NASA_API_FORMAT
                }
            });
            return response.data;
        } catch (error: any) {
            console.error('Ocorreu um erro na requisição à API da NASA:', error.response?.data || error.message);
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
        const query = this._buildApiQuery(selectClause, "koi_score is not null", 'koi_score desc');

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

    async saveExoPlanetById(planetId: string, userId: string): Promise<ViewPredictionDTO> {
        const whereClause = `kepler_name='${planetId}'`;
        const query = this._buildApiQuery(NASA_API_COLUMNS, whereClause);
        
        const planets = await this._performApiRequest(query);
        const planet = planets[0];

        if (!planet) {
            throw new NasaApiError(`Exoplanet with ID '${planetId}' not found in NASA Archive.`, 404);
        }

        const internalPrediction = this._mapPlanetToPrediction(planet);

        const predictionToSave = {
            id: internalPrediction.id,
            description: internalPrediction.description,
            probability: internalPrediction.probability,
            classification: internalPrediction.classification,
            createdAt: new Date(),
            existingData: true,
            userId: userId, 
            starParams: internalPrediction.starParams,
            candidateParams: internalPrediction.candidateParams,
            signalParams: internalPrediction.signalParams,
        };

        const createdPrediction = await this.predictionRepository.createPrediction(predictionToSave);

        this.cache.del(CACHE_KEYS.FIND_ALL);

        return formatPredictionByViewSchema(createdPrediction);
    }
}