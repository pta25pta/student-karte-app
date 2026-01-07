/**
 * ExternalDataService.js
 * 
 * Handles fetching data from external sources (GAS, Spreadsheets).
 */

const PREDICTION_API_URL = "https://script.google.com/macros/s/AKfycbxYA-mYhuoZlophGmeJZ99poSUTRI-xPLAjilEuyFJoUQ0iEuDpsa5Ini8L-HQceXGF/exec";

const SPREADSHEET_URL = ""; 

export const ExternalDataService = {
  
  /**
   * Fetches detailed prediction stats for a student from GAS.
   * @param {string} studentId 
   * @param {number} year - e.g., 2026
   * @param {number} month - 1-12
   * @returns {Promise<Object>} Full prediction data object
   */
  async fetchPredictionStats(studentId, year, month) {
    console.log('Fetching prediction stats for ' + studentId + ' (' + year + '/' + month + ') from GAS...');
    
    try {
      // Build URL with studentId, year, and month parameters
      let url = PREDICTION_API_URL + '?studentId=' + encodeURIComponent(studentId);
      if (year && month) {
        url += '&year=' + year + '&month=' + month;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });
      
      if (!response.ok) {
        throw new Error('HTTP error! status: ' + response.status);
      }
      
      const data = await response.json();
      console.log('GAS Response:', data);
      
      return {
        prediction: data.prediction,
        accuracy: data.accuracy || 0,
        winRate: data.winRate || 0,
        rank: data.rank || '-',
        totalRank: data.totalRank || 0,
        totalPredictions: data.totalPredictions || 0,
        correctPredictions: data.correctPredictions || 0,
        history: data.history || []
      };

    } catch (error) {
      console.error('Fetch error:', error);
      console.warn('GAS connection failed. Returning error state.');
      
      return {
        prediction: null,
        accuracy: 0,
        winRate: 0,
        rank: '-',
        totalRank: 0,
        totalPredictions: 0,
        correctPredictions: 0,
        history: [],
        error: true
      };
    }
  },

  async fetchDailyPrediction(studentId) {
    const stats = await this.fetchPredictionStats(studentId);
    return stats.prediction === true;
  },

  async fetchVerificationProgress(studentId) {
    if (!SPREADSHEET_URL) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const steps = ["未着手", "検証フェーズ1", "検証フェーズ2", "最終確認中", "完了"];
      let hash = 0;
      for (let i = 0; i < studentId.length; i++) {
        hash = studentId.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % steps.length;
      return steps[index];
    }

    try {
       const response = await fetch(SPREADSHEET_URL);
       const text = await response.text();
       return "Fetched Data";
    } catch (e) {
       console.error(e);
       return "Error";
    }
  }
};
