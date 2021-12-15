import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
       return JSON.parse(storagedCart);
     }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      // fazer um arrey de cart
      const updatedCart = [...cart];
      // procurar/ver se o produto existe
      const productExists = updatedCart.find(product => product.id === productId);

      //vamos pegar os dados da nossa api da rota stock
      const stock = await api.get(`/stock/${productId}`)

      //neste caso queremos pegar a quantidade dos produtos, amount
      const stockAmount = stock.data.amount;
      // verificamos se o produto existe, se o produto existe é o valor que tem, se não é 0.
      const currentAmount = productExists ? productExists.amount : 0;
      // variavel que verifica a quantidade solicitada
      const amount = currentAmount + 1

      //se a quantidade for maior que o stock, apresentamos já o erro
      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      // se o produto exist
      if(productExists){
        // adicionamos o valor da quantidade solicitada
        productExists.amount = amount;
      //caso o produto não exista
      }else{
        //vamos pegar os dados da nossa api da rota products
        const product = await api.get(`/products/${productId}`)
        //pegaremos todos os dados da nossa api e deveremos adicionar um valor ao amount.
        const newProduct = {
          ...product.data,
          amount: 1,
        }
        //adicionamos o produto
        updatedCart.push(newProduct);
      }
      
      setCart(updatedCart);
      //colocamos no local storage
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const productIndex = updatedCart.findIndex(product => product.id === productId);

      if(productIndex >= 0){
        updatedCart.slice(productIndex, 1);
        setCart(updatedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }else{
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0){
        return;
      }

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId)

      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      }else{
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
